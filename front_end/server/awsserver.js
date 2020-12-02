#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const path = require('path');
const getFromTable = require(`${__dirname}/../../src/aws/api/dynamoDB/getFromTable`);
const configDir = require('../../src/aws/utils/configDir');
require('dotenv').config({ path: `${configDir}/.env` });
const app = express();
const host = 'localhost';
const port = 7777;

app.use(cors());

app.use(express.static(path.resolve(__dirname + '/../app/build/')));

app.get('/', (_, res) => {
  res.sendFile(path.resolve(__dirname + '/../app/build/index.html'));
});

app.get('/events', async (req, res) => {
  const events = await getFromTable('EVENTS');
  res.set('Content-Type', 'application/json');
  res.send(events);
});

app.get('/traffic', async (req, res) => {
  const traffic = await getFromTable('TRAFFIC');
  res.set('Content-Type', 'application/json');
  res.send(traffic);
});

app.get('/endpoints', async (req, res) => {
  const endpoints = await getFromTable('SERVICES_CONFIG');
  res.set('Content-Type', 'application/json');
  res.send(endpoints);
});

app.get('/subdomain', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify(process.env.AWS_DOMAIN_NAME));
});

app.listen(port, host, () => {
  console.log(`\nCampion stats are now available at http://${host}:${port}.`);
  console.log('Control + C to quit.');
});

