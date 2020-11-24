#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const path = require('path');
const getAllKeys = require(`${__dirname}/../../src/workers/api/getAllKeys`);
const getAllServicesConfigs = require(`${__dirname}/../../src/utils/getAllServicesConfigs`);
const app = express();
const host = 'localhost';
const port = 7777;

app.use(cors());

app.use(express.static(path.resolve(__dirname + '/../app/build/')));

app.get('/', (_, res) => {
  res.sendFile(path.resolve(__dirname + '/../app/build/index.html'));
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

app.listen(port, host, () => {
  console.log(`\nServer is now running at http://${host}:${port}.`);
  console.log('Control + C to quit.');
});
