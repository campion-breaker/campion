#!/usr/bin/env node

const express = require("express");
const path = require('path');
const app = express();
const host = "localhost";
const port = 6969;

app.use(express.static(path.resolve(__dirname + "/../app/build/")));

app.get('/', (_, res) => {
  res.sendFile(path.resolve(__dirname + "/../app/build/index.html"))
});

app.listen(port, host, () => {
  console.log(`Server is now running at https://${host}:${port}.`);
  console.log('Control + C to quit.');
});
