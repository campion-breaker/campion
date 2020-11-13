async function handleRequest(request) {
  const serviceId = getServiceId(request.url);
  const service = getResourceObj(serviceId);
  if (service === null) return new Response("Circuit breaker doesn't exist", {status: 404});
}

function getServiceId(url) {
  return new URL(request.url).pathname.replace('/', '');
}

async function getResourceObj(serviceId) {
  const service = await RESOURCES.get(serviceId);
  return JSON.parse(service);
}
