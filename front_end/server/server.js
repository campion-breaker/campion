const http = require("http");
const fs = require("fs").promises;
const host = "localhost";
const port = 6969;
let indexFile;

const requestListener = (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200);
  res.end(indexFile);
};

const server = http.createServer(requestListener);

fs.readFile(__dirname + "/../app/build/index.html")
  .then((contents) => {
    indexFile = contents;
    server.listen(port, host, () => {
      console.log(`Server is now running at http://${host}:${port}.`);
      console.log("Control + C to quit.");
    });
  })
  .catch((err) => {
    console.error(`Could not read index.html file: ${err}`);
    process.exit(1);
  });
