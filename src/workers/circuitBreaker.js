async function handleRequest(request) {
  const serviceId = new URL(request.url).pathname.replace('/', '');
  const service = await RESOURCES.get(serviceId);
  if (service === null) return new Response("Circuit breaker doesn't exist", {status: 404});
}
