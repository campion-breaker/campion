const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const https = require('https');
const url = require('url');

async function flipState(service, newState) {
  await logEventStateChange(service, newState);

  const params = {
    TableName: 'SERVICES_CONFIG',
    Key: {
      ID: service.ID,
    },
    UpdateExpression: `SET CIRCUIT_STATE=:s, UPDATED_TIME=:t`,
    ExpressionAttributeValues: {
      ':s': newState,
      ':t': Date.now(),
    },
    ReturnValues: 'UPDATED_NEW',
  };

  try {
    const data = await documentClient
      .update(params, (err, data) => {
        console.log(data);
      })
      .promise();
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

const newResponse = (body, status, headers) => {
  return {
    body,
    headers: Object.assign({}, headers, status),
  };
};

async function handleRequest(request) {
  const serviceId = 'https://arthurkauffman.com';
  const service = await dbConfigRead('SERVICES_CONFIG', serviceId);
  const receivedTime = Date.now();

  if (service === null) {
    return newResponse("Circuit breaker doesn't exist", 404);
  }

  if (service.CIRCUIT_STATE === 'FORCED-OPEN') {
    await logRequestMetrics(receivedTime, service);
    return newResponse(
      'Circuit has been manually force-opened. Adjust in Campion CLI/GUI.',
      504
    );
  }

  if (service.CIRCUIT_STATE === 'OPEN') {
    await setStateWhenOpen(service, serviceId);
    if (service.CIRCUIT_STATE === 'OPEN') {
      await logRequestMetrics(receivedTime, service);
      return newResponse('Circuit is open', 504);
    }
  }

  if (service.CIRCUIT_STATE === 'HALF-OPEN' && !canRequestProceed(service)) {
    await logRequestMetrics(receivedTime, service);
    return newResponse('Circuit is half-open', 504);
  }

  const response = await processRequest(service);
  console.log('response', response);
  const responseTime = Date.now();

  await updateCircuitState(service, serviceId, response);
  await logRequestMetrics(receivedTime, service, responseTime, response.status);

  return newResponse(response.body, response.status, response.headers);
}

function canRequestProceed(service) {
  const min = 1;
  const max = Math.floor(100 / service.PERCENT_OF_REQUESTS);
  const randNum = Math.floor(Math.random() * (max - min + 1) + min);
  return randNum === 1;
}

async function processRequest(service) {
  let timeoutId;

  const timeoutPromise = new Promise((resolutionFunc) => {
    timeoutId = setTimeout(() => {
      resolutionFunc({
        failure: true,
        kvKey: '@NETWORK_FAILURE_' + Date.now(),
        status: 522,
      });
    }, service.MAX_LATENCY);
  });

  const fetchPromise = new Promise((resolve, reject) => {
    const req = https.request(
      Object.assign({}, url.parse(service.ID), { method: 'GET' }),
      (res) => {
        let body, failure, key;
        res.on('data', (data) => {
          clearTimeout(timeoutId);
          failure = false;
          key = '@SUCCESS_' + service.ID + Date.now();
          body = data.toString();
        });

        res.on('error', reject);
        res.on('end', () => {
          if (res.statusCode >= 500) {
            failure = true;
            key = '@SERVICE_FAILURE_' + service.ID + Date.now();
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

    req.on('error', (e) => {
      console.error(e);
    });

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
    await flipState(service, 'OPEN');
  }
}

async function setStateWhenOpen(service, serviceId) {
  const now = Date.now();
  const oldDate = service.UPDATED_TIME;
  const differenceInSecs = (now - oldDate) / 1000;

  if (differenceInSecs >= service.ERROR_TIMEOUT) {
    await flipState(service, 'HALF-OPEN');
  }
}

async function setStateWhenHalfOpen(service, serviceId) {
  const { successes, serviceFailures, networkFailures } = await requestLogCount(
    serviceId
  );

  if (successes >= service.SUCCESS_THRESHOLD) {
    await flipState(service, 'CLOSED');
  } else if (
    networkFailures >= service.NETWORK_FAILURE_THRESHOLD ||
    serviceFailures >= service.SERVICE_FAILURE_THRESHOLD
  ) {
    await flipState(service, 'OPEN');
  }
}

async function updateCircuitState(service, serviceId, response) {
  if (
    response.failure ||
    (service.CIRCUIT_STATE === 'HALF-OPEN' && !response.failure)
  ) {
    await putDB('REQUEST_LOG', { ID: response.key });
  }

  switch (service.CIRCUIT_STATE) {
    case 'CLOSED':
      await setStateWhenClosed(service, serviceId);
      break;
    case 'HALF-OPEN':
      await setStateWhenHalfOpen(service, serviceId);
      break;
  }
}

async function logEventStateChange(service, newState) {
  const stateChangeEntry = {
    ID: service.ID,
    NAME: service.NAME,
    EVENT: 'STATE_CHANGE',
    TIME: Date.now(),
    OLD_STATE: service.CIRCUIT_STATE,
    CIRCUIT_STATE: newState,
    MODE: 'AUTO',
  };

  await putDB('EVENTS', stateChangeEntry);
}

async function requestLogCount(serviceId) {
  const list = await dbFailureRead('REQUEST_LOG');
  const log = list.filter((obj) => obj.ID.includes(serviceId));
  const serviceFailures = log.filter((obj) =>
    obj.ID.includes('@SERVICE_FAILURE_')
  ).length;
  const networkFailures = log.filter((obj) =>
    obj.ID.includes('@NETWORK_FAILURE_')
  ).length;
  const successes = log.filter((obj) => obj.ID.includes('@SUCCESS_')).length;
  return { serviceFailures, networkFailures, successes };
}

async function logRequestMetrics(receivedTime, service, responseTime, status) {
  const key = JSON.stringify({
    ID: service.ID,
    STATUS: status || '',
    STATE: service.CIRCUIT_STATE,
    TIME: receivedTime,
    LATENCY: responseTime - receivedTime || '',
  });

  await putDB('TRAFFIC', key);
}

const blacklistedHeaders = [
  'connection',
  'expect',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'proxy-connection',
  'trailer',
  'upgrade',
  'x-accel-buffering',
  'x-accel-charset',
  'x-accel-limit-rate',
  'x-accel-redirect',
  'x-cache',
  'x-edge',
  'x-forward-proto',
  'x-real-ip',
];

const readOnlyHeaders = ['content-length', 'host', 'transfer-encoding', 'via'];

exports.handler = async (event, context, callback) => {
  const response = await handleRequest(event.request);

  Object.keys(response.headers).forEach((key) => {
    response.headers[key] = [{ key: key, value: response.headers[key] }];
    if (blacklistedHeaders.includes(key) || readOnlyHeaders.includes(key)) {
      delete response.headers[key];
    }
  });

  return callback(null, response);
};
