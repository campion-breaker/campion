async function handleRequest(request) {
  const serviceId = getServiceId(request.url);
  const service = getResourceObj(serviceId);
  if (service === null) return new Response("Circuit breaker doesn't exist", {status: 404});

  const state = circuitState(service);

  if (state === "OPEN") {
    return new Response('Circuit is open', {status: 504});
  } else if (state === "HALF-OPEN") {
    return new Response('Circuit is closed', {status: 504});
  }
}

function getServiceId(url) {
  return new URL(request.url).pathname.replace('/', '');
}

async function getResourceObj(serviceId) {
  const service = await RESOURCES.get(serviceId);
  return JSON.parse(service);
}

function circuitState(service) {
  return service.STATE;
}
