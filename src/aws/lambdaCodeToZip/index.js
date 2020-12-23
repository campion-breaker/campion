const AWS = require("aws-sdk");
const documentClient = new AWS.DynamoDB.DocumentClient();
const fetch = require("node-fetch");
const https = require("https");
const url = require("url")
const zlib = require("zlib");

async function handleRequest(request) {
  const serviceId = getIdFromUrl(request);
  const service = await dbConfigRead("SERVICES_CONFIG", serviceId);
  const receivedTime = Date.now();
  if (!service || service.statusCode === 500) {
    return newResponse("Circuit breaker doesn't exist", 404);
  }
  if (service.CIRCUIT_STATE === "FORCED-OPEN") {
    await logRequestMetrics(receivedTime, service);
    return newResponse(
      "Circuit has been manually force-opened. Adjust in Campion CLI/GUI.",
      504
    );
  }
  if (service.CIRCUIT_STATE === "OPEN") {
    await setStateWhenOpen(service);
    if (service.CIRCUIT_STATE === "OPEN") {
      await logRequestMetrics(receivedTime, service);
      return newResponse("Circuit is open", 504);
    }
  }
  if (service.CIRCUIT_STATE === "HALF-OPEN" && !canRequestProceed(service)) {
    await logRequestMetrics(receivedTime, service);
    return newResponse("Circuit is half-open", 504);
  }
  
  const response = await processRequest(service, request);
  const responseTime = Date.now();
  await updateCircuitState(service, response);
  await logRequestMetrics(receivedTime, service, responseTime, response.status);
  return newResponse(response.body, response.status, response.headers, response.bodyEncoding);
}
const getIdFromUrl = (request) => {
  if (request.Records && request.Records[0].cf.request.querystring) {
    return request.Records[0].cf.request.querystring.slice(3);
  }
  return "";
};
const getMethodFromRequest = (request) => {
  if (request.Records && request.Records[0].cf.request.method) {
    return request.Records[0].cf.request.method;
  }
  return "GET";
};
const getBodyFromRequest = (request) => {
  if (request.Records && request.Records[0].cf.request.body) {
    return request.Records[0].cf.request.body.data;
  }
  return "";
};
const getHeadersFromRequest = (request) => {
  const headersObj = request.Records[0].cf.request.headers;
  const headerKeys = Object.keys(headersObj);
  const formattedHeaders = {};
  headerKeys.forEach((key) => {
    const header = headersObj[key][0];
    if (
      key.includes("sec-") ||
      key.includes("host")
    )
      return;
    formattedHeaders[header["key"]] = header["value"];
  });
  return formattedHeaders;
};
async function flipState(service, newState) {
  await logEventStateChange(service, newState);
  const params = {
    TableName: "SERVICES_CONFIG",
    Key: {
      ID: service.ID,
    },
    UpdateExpression: `SET CIRCUIT_STATE=:s, UPDATED_TIME=:t`,
    ExpressionAttributeValues: {
      ":s": newState,
      ":t": Date.now(),
    },
    ReturnValues: "UPDATED_NEW",
  };
  try {
    const data = await documentClient.update(params).promise();
    return { statusCode: 200 };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }
}
async function putDB(tableName, items) {
  const params = {
    TableName: tableName,
    Item: {
      ...items,
    },
  };
  try {
    const data = await documentClient.put(params).promise();
    const response = {
      statusCode: 200,
    };
    return response;
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }
}
async function dbConfigRead(tableName, serviceName) {
  const params = {
    TableName: tableName,
    Key: {
      ID: serviceName,
    },
  };
  try {
    const data = await documentClient.get(params).promise();
    const response = data.Item;
    return response;
  } catch (e) {
    return {
      statusCode: 500,
    };
  }
}
async function dbFailureRead(tableName) {
  const params = {
    TableName: tableName,
  };
  try {
    const data = await documentClient.scan(params).promise();
    const response = data.Items;
    return response;
  } catch (e) {
    return {
      statusCode: 500,
    };
  }
}
const newResponse = (body = "", status = 200, headers = {}, bodyEncoding) => {
  if (bodyEncoding) {
    return {
    status,
    headers,
    body,
    bodyEncoding,
    }
  } else {
    return {
      status,
      headers,
      body
    }
  }
};
function canRequestProceed(service) {
  const min = 1;
  const max = Math.floor(100 / service.PERCENT_OF_REQUESTS);
  const randNum = Math.floor(Math.random() * (max - min + 1) + min);
  return randNum === 1;
}

async function processRequest(service, request) {
  const method = getMethodFromRequest(request);
  const reqBody = getBodyFromRequest(request);
  const headers = getHeadersFromRequest(request);
  let timeoutId;
  const timeoutPromise = new Promise((resolutionFunc) => {
    timeoutId = setTimeout(() => {
      resolutionFunc({
        failure: true,
        key: '@NETWORK_FAILURE_' + service.ID + Date.now(),
        status: 522,
      });
    }, service.MAX_LATENCY);
  });

  const fetchPromise = new Promise((resolve, reject) => {
    const req = https.request(
      Object.assign({}, url.parse(service.ID), {method, headers}),
      (res) => {
        const headers = res.headers;
        const status = res.statusCode;
        let chunks = [];
        let failure, key;

        res.on("data", data => {
          chunks.push(data)
        });

        res.on("end", () => {
          clearTimeout(timeoutId);

          if (res.statusCode >= 400) {
            failure = true;
            key = "@SERVICE_FAILURE_" + service.ID + "_" + Date.now();
          } else {
            failure = false;
            key = "@SUCCESS_" + service.ID + "_" + Date.now();
          }
          
          const body = Buffer.concat(chunks).toString('base64');
          resolve({ body, bodyEncoding: 'base64', headers, failure, key, status });
        });
      }
    );
    req.on('error', (e) => console.log('errrooor', e))
    req.end(reqBody, 'base64');
  });
  
  return await Promise.race([fetchPromise, timeoutPromise]).then((value) => {
    return value;
  });
};
async function setStateWhenClosed(service) {
  const { serviceFailures, networkFailures } = await requestLogCount(service);
  if (
    serviceFailures >= service.SERVICE_FAILURE_THRESHOLD ||
    networkFailures >= service.NETWORK_FAILURE_THRESHOLD
  ) {
    await flipState(service, "OPEN");
  }
}
async function setStateWhenOpen(service) {
  const now = Date.now();
  const oldDate = service.UPDATED_TIME;
  const differenceInMS = (now - oldDate);
  if (differenceInMS >= service.ERROR_TIMEOUT) {
    await flipState(service, "HALF-OPEN");
  }
}
async function setStateWhenHalfOpen(service) {
  const { successes, serviceFailures, networkFailures } = await requestLogCount(
    service
  );
  if (successes >= service.SUCCESS_THRESHOLD) {
    await flipState(service, "CLOSED");
  } else if (
    networkFailures >= service.NETWORK_FAILURE_THRESHOLD ||
    serviceFailures >= service.SERVICE_FAILURE_THRESHOLD
  ) {
    await flipState(service, "OPEN");
  }
}
async function updateCircuitState(service, response) {
  if (
    response.failure ||
    (service.CIRCUIT_STATE === "HALF-OPEN" && !response.failure)
  ) {
    await putDB("REQUEST_LOG", {
      ID: response.key,
      TIME: (Date.now() + service.ERROR_TIMEOUT) / 1000,
    });
  }
  switch (service.CIRCUIT_STATE) {
    case "CLOSED":
      await setStateWhenClosed(service);
      break;
    case "HALF-OPEN":
      await setStateWhenHalfOpen(service);
      break;
  }
}
async function logEventStateChange(service, newState) {
  const stateChangeEntry = {
    ID: service.ID + "_" + Date.now(),
    NAME: service.NAME,
    EVENT: "STATE_CHANGE",
    TIME: Date.now(),
    OLD_STATE: service.CIRCUIT_STATE,
    CIRCUIT_STATE: newState,
    MODE: "AUTO",
  };
  await putDB("EVENTS", stateChangeEntry);
}
async function requestLogCount(service) {
  const list = await dbFailureRead("REQUEST_LOG");
  const log = list.filter(
    (obj) =>
      obj.ID.includes(service.ID) &&
      obj.TIME * 1000 > Date.now() - service.TIMESPAN
  );
  const serviceFailures = log.filter((obj) =>
    obj.ID.includes("@SERVICE_FAILURE_")
  ).length;
  const networkFailures = log.filter((obj) =>
    obj.ID.includes("@NETWORK_FAILURE_")
  ).length;
  const successes = log.filter((obj) => obj.ID.includes("@SUCCESS_")).length;
  return { serviceFailures, networkFailures, successes };
}
async function logRequestMetrics(receivedTime, service, responseTime, status) {
  const key = {
    ID: service.ID + "_" + receivedTime,
    STATUS: status || "",
    STATE: service.CIRCUIT_STATE,
    TIME: receivedTime,
    LATENCY: responseTime - receivedTime || "",
  };
  await putDB("TRAFFIC", key);
}
const blacklistedHeaders = [
  "set-cookie",
  "connection",
  "expect",
  "etag",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "proxy-connection",
  "trailer",
  "upgrade",
  "x-accel-buffering",
  "x-accel-charset",
  "x-accel-limit-rate",
  "x-accel-redirect",
  "x-cache",
  "x-edge",
  "x-forwarded-proto",
  "x-real-ip",
];
const readOnlyHeaders = ["content-length", "host", "transfer-encoding", "via"];
const fixHeaders = (response) => {
  response.headers["access-control-allow-origin"] = "*";
  response.headers["access-control-allow-methods"] = "*";
  response.headers["access-control-max-age"] = "86400";
  Object.keys(response.headers).forEach((key) => {
    response.headers[key] = [{ value: response.headers[key] }];
    if (blacklistedHeaders.includes(key) || readOnlyHeaders.includes(key) || key.includes('x-amzn')) {
      delete response.headers[key];
    }
  });
  return response;
};

exports.handler = async (event, context, callback) => {
  const response = await handleRequest(event);
  context.callbackWaitsForEmptyEventLoop = false;
  const fixedHeaders = fixHeaders(response);
  return callback(null, fixedHeaders);
};


