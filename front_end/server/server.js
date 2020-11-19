const express = require("express");
const app = express();
const host = "localhost";
const port = 6969;

app.use(express.static(__dirname + "/../app/build/"));

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/../app/build/index.html")
});

app.listen(port, host, () => {
  console.log(`Server is now running at https://${host}:${port}.`);
  console.log('Control + C to quit.');
});
