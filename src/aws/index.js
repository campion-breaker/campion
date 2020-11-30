const AWS = require("aws-sdk");
const crypto = require("crypto");
const generateUUID = () => crypto.randomBytes(16).toString("hex");
const documentClient = new AWS.DynamoDB.DocumentClient();
const https = require('https');
const url = require('url');

async function flipState(serviceName, newState) {
  const params = {
    TableName: "RESOURCES",
    Key: {
      ServiceName: serviceName,
    },
    UpdateExpression: `SET CIRCUIT_STATE=:s, UPDATED_TIME=:t`,
    ExpressionAttributeValues: {
      ":s": newState,
      ":t": Date.now(),
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    const data = await documentClient
      .update(params, (err, data) => {
        console.log(data);
      })
      .promise();
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

async function logFailure(failureKey) {
  const params = {
    TableName: "FAILURES",
    Item: {
      ServiceName: failureKey,
      Time: Date.now() + 60000,
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
      'ServiceName': serviceName
    }
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

async function dbFailureRead(tableName, serviceName) {
  const params = {
    TableName: tableName,
  };

  try {
    const data = await documentClient.scan(params).promise();
    const response = {
      body: data.Items,
    };
    return response;
  } catch (e) {
    return {
      statusCode: 500,
    };
  }
}

async function handleRequest(request) {
  // parse url for serviceName
  const serviceName = "SuccessService";
  const config = await dbConfigRead('RESOURCES', serviceName);
  const circuitStateObj = await circuitState(serviceName, config, request);

  if (circuitStateObj.state === "OPEN") {
    return {body: {failureKind: circuitStateObj.failureKind}, headers: {status: 504}};
  } else if (circuitStateObj.state === "HALF-OPEN" && !canRequestProceed(config)) {
    return {body: {failureKind: circuitStateObj.failureKind}, headers: {status: 504}};
  }

  const response = await processRequest(request, config, serviceName);
  if (response.failure) {
    logFailure(response.key);
  } else if (!response.failure && circuitStateObj.state === "HALF-OPEN") {
    logFailure(response.key);
  }

  return {body: response.body, status: response.status, headers: response.headers};
}

function canRequestProceed(config) {
  const min = 1;
  const max = Math.floor(100 / config.PERCENT_OF_REQUESTS);
  const randNum = Math.floor(Math.random() * (max - min + 1) + min);
  return randNum === 1;
}

async function circuitState(serviceName, config, request) {
  const { serviceFailures, networkFailures, successes } = await failureCount(
    request, serviceName
  );
  let failureKind;
  const state = config.CIRCUIT_STATE;
  const response = { state };

  if (
    state === "CLOSED" && (serviceFailures >= config.SERVICE_FAILURE_THRESHOLD ||
    networkFailures >= config.NETWORK_FAILURE_THRESHOLD)
  ) {
    failureKind =
      serviceFailures >= config.SERVICE_FAILURE_THRESHOLD
        ? "Service failure"
        : "Network failure";
    flipState(serviceName, "OPEN");
  } else if (state === "OPEN") {
    const now = Date.now();
    const oldDate = Number(config.UPDATED_TIME);
    const differenceInSecs = (now - oldDate) / 1000;
    if (differenceInSecs >= config.ERROR_TIMEOUT) {
      flipState(serviceName, "HALF-OPEN");
      response.state = "HALF-OPEN";
    }
    response.failureKind = failureKind;
  } else if (state === "HALF-OPEN") {
    if (successes >= 1) {
      flipState(serviceName, "CLOSED");
    } else if (
      networkFailures >= config.NETWORK_FAILURE_THRESHOLD ||
      serviceFailures >= config.SERVICE_FAILURE_THRESHOLD
    ) {
      flipState(serviceName, "OPEN");
    }
  }

  return response;
}

async function failureCount(request, serviceName) {
  const list = await dbFailureRead('FAILURES');
  const failures = list.body.filter((obj) => obj.ServiceName.includes(serviceName));
  const serviceFailures = failures.filter((obj) =>
    obj.ServiceName.includes("@SERVICE_FAILURE_")
  ).length;
  const networkFailures = failures.filter((obj) =>
    obj.ServiceName.includes("@NETWORK_FAILURE_")
  ).length;
  const successes = failures.filter((obj) => obj.ServiceName.includes("@SUCCESS_"))
    .length;
  return { serviceFailures, networkFailures, successes };
}

async function processRequest(request, config, serviceName) {
  let timeoutId;
  const timeoutPromise = new Promise((resolutionFunc, rejectionFunc) => {
    timeoutId = setTimeout(() => {
      resolutionFunc({ failure: true, kvKey: "@NETWORK_FAILURE_" + serviceName + generateUUID(), status: 522 });
    }, config.MAX_LATENCY);
  });

  const fetchPromise = new Promise((resolve, reject) => {
    const req = https.request(Object.assign({}, url.parse(config.SERVICE), {method: 'GET'}), res => {
      let body, failure, key;
      res.on('data', (data) => {
        clearTimeout(timeoutId);
        failure = false;
        key = "@SUCCESS_" + serviceName + generateUUID();
        body = data.toString();
      })

      res.on('error', reject);
      res.on('end', () => {
        if (res.statusCode >= 500) {
          failure = true;
          key = "@SERVICE_FAILURE_" + serviceName + generateUUID();
        }

        resolve({status: res.statusCode, headers: res.headers, body: body, failure, key});
      });
    });

    req.on('error', (e) => {
      console.error(e);
    });

    req.end();
  });

  return await Promise.race([fetchPromise, timeoutPromise]).then((value) => {
    return value;
  });
}
const blacklistedHeaders = [
  'connection', 'expect', 'keep-alive', 'proxy-authenticate', 
  'proxy-authorization', 'proxy-connection', 'trailer', 'upgrade',
  'x-accel-buffering', 'x-accel-charset', 'x-accel-limit-rate', 
  'x-accel-redirect', 'x-cache', 'x-edge', 
  'x-forward-proto', 'x-real-ip'
  ];
  
const readOnlyHeaders = [
  'content-length', 'host', 'transfer-encoding', 'via'
  ];
  
exports.handler = async (event, context, callback) => {
  const response = await handleRequest(event.request);

  Object.keys(response.headers).forEach((key) => {
    response.headers[key] = [{ key: key, value: response.headers[key]}]
    if (blacklistedHeaders.includes(key) || readOnlyHeaders.includes(key)) {
      delete response.headers[key];
    }
  });
  
  return callback(null, response);
};

