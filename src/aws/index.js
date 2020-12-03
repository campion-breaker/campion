const AWS = require("aws-sdk");
const documentClient = new AWS.DynamoDB.DocumentClient();
const https = require("https");
const url = require("url");

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
    await setStateWhenOpen(service, serviceId);
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

  await updateCircuitState(service, serviceId, response);
  await logRequestMetrics(receivedTime, service, responseTime, response.status);

  return newResponse(response.body, response.status, response.headers);
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
      key.includes("accept-encoding") ||
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

const newResponse = (body = "", status = 200, headers = {}) => {
  return {
    status,
    headers,
    body,
  };
};

function canRequestProceed(service) {
  const min = 1;
  const max = Math.floor(100 / service.PERCENT_OF_REQUESTS);
  const randNum = Math.floor(Math.random() * (max - min + 1) + min);
  return randNum === 1;
}

async function processRequest(service, request) {
  let timeoutId;
  const method = getMethodFromRequest(request);
  const body = getBodyFromRequest(request);
  const headers = getHeadersFromRequest(request);
  const timeoutPromise = new Promise((resolutionFunc) => {
    timeoutId = setTimeout(() => {
      resolutionFunc({
        failure: true,
        kvKey: "@NETWORK_FAILURE_" + Date.now(),
        status: 522,
      });
    }, service.MAX_LATENCY);
  });

  const fetchPromise = new Promise((resolve, reject) => {
    const req = https.request(
      Object.assign({}, url.parse(service.ID), { method, headers }),
      (res) => {
        let body, failure, key;

        res.on("data", (data) => {
          failure = false;
          key = "@SUCCESS_" + service.ID + Date.now();
          body = data.toString();
        });

        res.on("error", () => {
          reject;
        });

        res.on("end", () => {
          clearTimeout(timeoutId);
          if (res.statusCode >= 500) {
            failure = true;
            key = "@SERVICE_FAILURE_" + service.ID + Date.now();
          }

          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
            failure,
            key,
          });
        });
      }
    );

    req.on("error", (e) => {
      console.error(e);
    });

    req.write(body);
    req.end();
  });

  return await Promise.race([fetchPromise, timeoutPromise]).then((value) => {
    return value;
  });
}

async function setStateWhenClosed(service, serviceId) {
  const { serviceFailures, networkFailures } = await requestLogCount(serviceId);

  if (
    serviceFailures >= service.SERVICE_FAILURE_THRESHOLD ||
    networkFailures >= service.NETWORK_FAILURE_THRESHOLD
  ) {
    await flipState(service, "OPEN");
  }
}

async function setStateWhenOpen(service, serviceId) {
  const now = Date.now();
  const oldDate = service.UPDATED_TIME;
  const differenceInSecs = (now - oldDate) / 1000;

  if (differenceInSecs >= service.ERROR_TIMEOUT) {
    await flipState(service, "HALF-OPEN");
  }
}

async function setStateWhenHalfOpen(service, serviceId) {
  const { successes, serviceFailures, networkFailures } = await requestLogCount(
    serviceId
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

async function updateCircuitState(service, serviceId, response) {
  if (
    response.failure ||
    (service.CIRCUIT_STATE === "HALF-OPEN" && !response.failure)
  ) {
    await putDB("REQUEST_LOG", {
      ID: response.key,
      TIME: (Date.now() + service.ERROR_TIMEOUT) / 60,
    });
  }

  switch (service.CIRCUIT_STATE) {
    case "CLOSED":
      await setStateWhenClosed(service, serviceId);
      break;
    case "HALF-OPEN":
      await setStateWhenHalfOpen(service, serviceId);
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

async function requestLogCount(serviceId) {
  const list = await dbFailureRead("REQUEST_LOG");
  const log = list.filter((obj) => obj.ID.includes(serviceId));
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
  "connection",
  "expect",
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
  "x-forward-proto",
  "x-real-ip",
];

const readOnlyHeaders = ["content-length", "host", "transfer-encoding", "via"];

exports.handler = async (event, context, callback) => {
  const response = await handleRequest(event);

  Object.keys(response.headers).forEach((key) => {
    response.headers[key] = [{ value: response.headers[key] }];
    if (blacklistedHeaders.includes(key) || readOnlyHeaders.includes(key)) {
      delete response.headers[key];
    }
  });

  context.callbackWaitsForEmptyEventLoop = false;
  return callback(null, response);
};
