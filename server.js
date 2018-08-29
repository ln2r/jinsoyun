const http = require('http');
const express = require('express');
const app = express();

app.get("/", (request, response) => {
  response.sendStatus(200);
});

app.listen(process.env.PORT);
setInterval(() => {
  http.get(process.env.PROJECT_DOMAIN);
}, 280000);