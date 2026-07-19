const express = require("express");
const http = require("http");
const WebSocket = require("ws");
require("dotenv").config();

const app = express();

app.get("/", (req, res) => {
  res.send("AI Receptionist is running!");
});

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Twilio connected.");

  ws.on("message", (message) => {
    console.log("Received:", message.toString());
  });

  ws.on("close", () => {
    console.log("Twilio disconnected.");
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
