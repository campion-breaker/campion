const fetch = require("node-fetch");
const FormData = require("form-data");
const configDir = require("../utils/configDir");
const fs = require("fs");
require("dotenv").config({ path: `${configDir}/.env` });

const apiBase = 'https://api.cloudflare.com/client/v4/';

const getZone = async () => {
  let response = await fetch(`${apiBase}/zones`, {
    method: 'GET',
    headers: {
      "X-Auth-Email": process.env.EMAIL,
      "X-Auth-Key": process.env.APIKEY,
      "Content-Type": 'application/json',
    },
  });
  response.json().then(e => console.log(e));
  if (!response.ok) {
    throw new Error(
      `GET zone failed.\n${response.status}: ${
        response.statusText
      }\n${await response.text()}`
    );
  }
};

getZone();
