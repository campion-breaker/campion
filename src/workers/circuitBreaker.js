function UUID() {
  const alphanum = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = '';

  for (let i = 0; i < 16; i++) {
    result += alphanum[Math.floor(Math.random() * 36)];  
  }

  return result;
}

async function handleRequest(request) {
  const serviceId = getServiceId(request.url);
  const service = await getServiceObj(serviceId);

  if (service === null) {
    return new Response("Circuit breaker doesn't exist", { status: 404 });
  }

  if (service.CIRCUIT_STATE === "OPEN") {
    await setStateWhenOpen(service, serviceId);

    if (service.CIRCUIT_STATE === "OPEN") {
      return new Response("Circuit is open", { status: 504 });
    }
  } else if (
    service.CIRCUIT_STATE === "HALF-OPEN" &&
    !canRequestProceed(service)
  ) {
    return new Response("Circuit is half-open", { status: 504 });
  }

  const response = await processRequest(request, service, serviceId);
  await updateCircuitState(service, serviceId, response);
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

function getServiceId(url) {
  return new URL(url).pathname.replace("/", "");
}

async function getServiceObj(serviceId) {
  if (serviceId === "") return null;
  const service = await SERVICES_CONFIG.get(serviceId);
  return JSON.parse(service);
}

function canRequestProceed(service) {
  const min = 1;
  const max = Math.floor(100 / service.PERCENT_OF_REQUESTS);
  const randNum = Math.floor(Math.random() * (max - min + 1) + min);
  return randNum === 1;
}

async function processRequest(request, service) {
  let timeoutId;

  const timeoutPromise = new Promise((resolutionFunc, rejectionFunc) => {
    timeoutId = setTimeout(() => {
      resolutionFunc({
        failure: true,
        kvKey: "@NETWORK_FAILURE_" + UUID(),
        status: 522,
      });
    }, service.MAX_LATENCY);
  });

  const fetchPromise = fetch(service.SERVICE).then(async (data) => {
    clearTimeout(timeoutId);

    let failure = false;
    let kvKey = "@SUCCESS_" + UUID();
    const body = await data.body;
    const headers = await data.headers;
    const status = await data.status;

    if (Number(status) >= 500) {
      failure = true;
      kvKey = "@SERVICE_FAILURE_" + UUID();
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
    await flipCircuitState(serviceId, service, "OPEN");
  }
}

async function setStateWhenOpen(service, serviceId) {
  const now = Date.now();
  const oldDate = Number(service.UPDATED_TIME);
  const differenceInSecs = (now - oldDate) / 1000;

  if (differenceInSecs >= service.ERROR_TIMEOUT) {
    await flipCircuitState(serviceId, service, "HALF-OPEN");
  }
}

async function setStateWhenHalfOpen(service, serviceId) {
  const { successes, serviceFailures, networkFailures } = await requestLogCount(
    serviceId
  );

  if (successes >= 1) {
    await flipCircuitState(serviceId, service, "CLOSED");
  } else if (
    networkFailures >= service.NETWORK_FAILURE_THRESHOLD ||
    serviceFailures >= service.SERVICE_FAILURE_THRESHOLD
  ) {
    await flipCircuitState(serviceId, service, "OPEN");
  }
}

async function updateCircuitState(service, serviceId, response) {
  if (
    response.failure ||
    (service.CIRCUIT_STATE === "HALF-OPEN" && !response.failure)
  ) {
    await updateRequestLog(response.kvKey, serviceId, service);
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

async function flipCircuitState(serviceId, service, newState) {
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
    obj.name.includes("@SERVICE_FAILURE_")
  ).length;
  const networkFailures = log.filter((obj) =>
    obj.name.includes("@NETWORK_FAILURE_")
  ).length;
  const successes = log.filter((obj) => obj.name.includes("@SUCCESS_")).length;
  return { serviceFailures, networkFailures, successes };
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
