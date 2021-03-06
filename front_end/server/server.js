#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const path = require('path');
const getAllKeys = require(`${__dirname}/../../src/cloudflare/api/getAllKeys`);
const getAllServicesConfigs = require(`${__dirname}/../../src/cloudflare/utils/getAllServicesConfigs`);
const configDir = require('../../src/cloudflare/utils/configDir');
require('dotenv').config({ path: `${configDir}/.env` });
const app = express();
const host = 'localhost';
const port = 7777;

app.use(cors());

app.use(express.static(path.resolve(__dirname + '/../app/public/')));

app.get('/', (_, res) => {
  res.sendFile(path.resolve(__dirname + '/../app/public/index.html'));
});

app.get('/events', async (req, res) => {
  const events = await getAllKeys('EVENTS_ID');
  res.set('Content-Type', 'application/json');
  res.send(events);
});

app.get('/traffic', async (req, res) => {
  const traffic = await getAllKeys('TRAFFIC_ID');
  res.set('Content-Type', 'application/json');
  res.send(traffic);
});

app.get('/endpoints', async (req, res) => {
  const endpoints = await getAllServicesConfigs();
  res.set('Content-Type', 'application/json');
  res.send(endpoints);
});

app.get('/subdomain', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify(process.env.SUBDOMAIN));
});

app.listen(port, host, () => {
  console.log(`\nCampion stats are now available at http://${host}:${port}.`);
  console.log('Control + C to quit.');
});
