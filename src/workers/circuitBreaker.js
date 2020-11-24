async function handleRequest(request) {
  const serviceId = getServiceId(request.url);
  const service = await getServiceObj(serviceId);
  const receivedTime = Date.now();

  if (service === null) {
    return new Response("Circuit breaker doesn't exist", { status: 404 });
  }

  if (service.CIRCUIT_STATE === 'FORCED-OPEN') {
    requestMetrics.circuitState = 'FORCED-OPEN';
    await logRequestMetrics(receivedTime, service);
    return new Response(
      'Circuit has been manually force-opened. Adjust in Campion CLI/GUI.',
      { status: 504 }
    );
  }

  if (service.CIRCUIT_STATE === 'OPEN') {
    await setStateWhenOpen(service, serviceId);

    if (service.CIRCUIT_STATE === 'OPEN') {
      requestMetrics.circuitState = 'OPEN';
      await logRequestMetrics(receivedTime, service);
      return new Response('Circuit is open', { status: 504 });
    }
  }

  if (service.CIRCUIT_STATE === 'HALF-OPEN' && !canRequestProceed(service)) {
    requestMetrics.circuitState = 'HALF_OPEN';
    await logRequestMetrics(receivedTime, service);
    return new Response('Circuit is half-open', { status: 504 });
  }

  const response = await processRequest(service);
  const responseTime = Date.now();

  await updateCircuitState(service, serviceId, response);
  await logRequestMetrics(receivedTime, service, responseTime, response.status);

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

function getServiceId(url) {
  if (url.slice(-1) === '/') {
    url = url.slice(0, -1);
  }

  return url.split('workers.dev/service?id=')[1];
}

async function getServiceObj(serviceId) {
  if (serviceId === '') return null;
  const service = await SERVICES_CONFIG.get(serviceId);
  return JSON.parse(service);
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

  const fetchPromise = fetch(service.ID).then(async (data) => {
    clearTimeout(timeoutId);

    let failure = false;
    let kvKey = '@SUCCESS_' + Date.now();
    const body = data.body;
    const headers = data.headers;
    const status = data.status;

    if (Number(status) >= 500) {
      failure = true;
      kvKey = '@SERVICE_FAILURE_' + Date.now();
    }

    return { body, headers, failure, kvKey, status };
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
    await flipCircuitState(serviceId, service, 'OPEN');
  }
}

async function setStateWhenOpen(service, serviceId) {
  const now = Date.now();
  const oldDate = Number(service.UPDATED_TIME);
  const differenceInSecs = (now - oldDate) / 1000;

  if (differenceInSecs >= service.ERROR_TIMEOUT) {
    await flipCircuitState(serviceId, service, 'HALF-OPEN');
  }
}

async function setStateWhenHalfOpen(service, serviceId) {
  const { successes, serviceFailures, networkFailures } = await requestLogCount(
    serviceId
  );

  if (successes >= service.SUCCESS_THRESHOLD) {
    await flipCircuitState(serviceId, service, 'CLOSED');
  } else if (
    networkFailures >= service.NETWORK_FAILURE_THRESHOLD ||
    serviceFailures >= service.SERVICE_FAILURE_THRESHOLD
  ) {
    await flipCircuitState(serviceId, service, 'OPEN');
  }
}

async function updateCircuitState(service, serviceId, response) {
  if (
    response.failure ||
    (service.CIRCUIT_STATE === 'HALF-OPEN' && !response.failure)
  ) {
    await updateRequestLog(response.kvKey, serviceId, service);
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

  await EVENTS.put(JSON.stringify(stateChangeEntry), '');
}

async function flipCircuitState(serviceId, service, newState) {
  await logEventStateChange(service, newState);
  service.CIRCUIT_STATE = newState;
  service.UPDATED_TIME = Date.now().toString();
  await SERVICES_CONFIG.put(serviceId, JSON.stringify(service));
}

async function updateRequestLog(kvKey, serviceId, service) {
  await REQUEST_LOG.put(kvKey + serviceId, Date.now().toString(), {
    expirationTtl: service.TIMESPAN,
  });
}

async function requestLogCount(serviceId) {
  const list = await REQUEST_LOG.list();
  const log = list.keys.filter((obj) => obj.name.includes(serviceId));
  const serviceFailures = log.filter((obj) =>
    obj.name.includes('@SERVICE_FAILURE_')
  ).length;
  const networkFailures = log.filter((obj) =>
    obj.name.includes('@NETWORK_FAILURE_')
  ).length;
  const successes = log.filter((obj) => obj.name.includes('@SUCCESS_')).length;
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

  await TRAFFIC.put(key, '');
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});
