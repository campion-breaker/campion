const update = require('../workers/api/updateServicesConfig');
const prompt = require('prompts');
const fetch = require('node-fetch');
const getServiceConfig = require('../workers/api/getServiceConfig');
const configExists = require('../utils/validateConfig');

const initialState = {
  CIRCUIT_STATE: 'CLOSED',
  ERROR_TIMEOUT: 60,
  MAX_LATENCY: 3000,
  NETWORK_FAILURE_THRESHOLD: 5,
  PERCENT_OF_REQUESTS: 25,
  SERVICE: '',
  SERVICE_NAME: '',
  SERVICE_FAILURE_THRESHOLD: 3,
  SUCCESS_THRESHOLD: 2,
  TIMESPAN: 60,
};

const formatUrl = (url) => {
  if (url.slice(-1) === '/') {
    return url.slice(0, -1);
  }

  return url;
};

const questions = (state) => [
  {
    type: 'text',
    name: 'SERVICE_NAME',
    message: 'Enter the name of the service: ',
    initial: state.SERVICE_NAME || '',
  },
  {
    type: 'text',
    name: 'SERVICE',
    message: 'Enter the service URL: ',
    initial: state.SERVICE || '',
    validate: async (url) => await validateUrl(url),
    format: (url) => formatUrl(url),
  },
  {
    type: 'number',
    name: 'MAX_LATENCY',
    message:
      "How many milliseconds should Campion wait until the request is considered 'failed'?",
    initial: state.MAX_LATENCY || 1000,
  },
  {
    type: 'number',
    name: 'TIMESPAN',
    message:
      'How far back (sec) should Campion look for failures (aka TIMESPAN)?',
    initial: state.TIMESPAN || 60,
  },
  {
    type: 'number',
    name: 'NETWORK_FAILURE_THRESHOLD',
    message:
      'How many NETWORK FAILURES (within TIMESPAN) will open the Breaker?',
    initial: state.NETWORK_FAILURE_THRESHOLD || 5,
  },
  {
    type: 'number',
    name: 'SERVICE_FAILURE_THRESHOLD',
    message:
      'How many SERVICE FAILURES (within TIMESPAN) will open the Breaker?',
    initial: state.SERVICE_FAILURE_THRESHOLD || 3,
  },
  {
    type: 'number',
    name: 'ERROR_TIMEOUT',
    message:
      'After opening, how long (sec) should Campion wait until it begins sending test traffic?',
    initial: state.ERROR_TIMEOUT || 60,
  },
  {
    type: 'number',
    name: 'PERCENT_OF_REQUESTS',
    message:
      'When Campion is HALF_OPEN, what percentage of requests should it send as tests?',
    initial: state.PERCENT_OF_REQUESTS || 25,
  },
  {
    type: 'number',
    name: 'SUCCESS_THRESHOLD',
    message:
      'When Campion is HALF-OPEN, how many successes (within TIMESPAN) will close the Breaker?',
    initial: state.SUCCESS_THRESHOLD || 2,
  },
];

const validateUrl = async (url) => {
  try {
    const data = await fetch(url);
    return (
      (data.status >= 200 && data.status <= 299) ||
      (data.status >= 500 && data.status <= 599)
    );
  } catch (e) {
    return 'Invalid url endpoint.';
  }
};

const setServiceConfig = async (state) => {
  const newState = await prompt(questions(state));
  newState.CIRCUIT_STATE = state.CIRCUIT_STATE;
  return newState;
};

const servicePromptConfig = async (state) => {
  const newState = await setServiceConfig(state || initialState);
  return newState;
};

module.exports = servicePromptConfig;
