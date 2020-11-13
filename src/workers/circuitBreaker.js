const { v4: UUID } = require('uuid');

async function handleRequest(request) {
  const serviceId = getServiceId(request.url);
  const service = getServiceObj(serviceId);
  if (service === null) return new Response("Circuit breaker doesn't exist", {status: 404});

  const state = circuitState(service);

  if (state === "OPEN") {
    return new Response('Circuit is open', {status: 504});
  } else if (state === "HALF-OPEN" && !canRequestProceed(serviceObj)) {
    return new Response('Circuit is closed', {status: 504});
  }

  const response = await processRequest(request, service);
}

function getServiceId(url) {
  return new URL(request.url).pathname.replace('/', '');
}

async function getServiceObj(serviceId) {
  const service = await RESOURCES.get(serviceId);
  return JSON.parse(service);
}

function circuitState(service) {
  return service.STATE;
}

function canRequestProceed(service) {
  const min = 1;
  const max = Math.floor(100 / service.PERCENT_OF_REQUESTS);
  const randNum = Math.floor(Math.random() * (max - min + 1) + min);
  return randNum === 1;
}

async function processRequest(request, serviceObj) {
  let timeoutId;

  const timeoutPromise = new Promise((resolutionFunc, rejectionFunc) => {
    timeoutId = setTimeout(() => {
      resolutionFunc({ failure: true, kvKey: "@NETWORK_FAILURE_" + UUID(), status: 522 });
    }, serviceObj.MAX_LATENCY);
  });
}
