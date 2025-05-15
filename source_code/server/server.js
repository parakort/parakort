const express = require('express');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const http = require('http');
const { setupWebSocket } = require('./ws');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/', require('./api'));

// 🔑 Create the HTTP server and bind both Express and WebSocket to it
const server = http.createServer(app);
setupWebSocket(server); // Call WS setup here

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`${process.env.APP_NAME} is running on port ${PORT}`);
});
