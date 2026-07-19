const OpenAI = require("openai");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
require("dotenv").config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

// This is the endpoint Twilio will call
app.post("/voice", (req, res) => {
  res.set("Content-Type", "text/xml");

  res.send(`
<Response>
    <Say voice="alice">
        Hello! Thanks for calling. Our AI receptionist will be available shortly.
    </Say>
</Response>
  `);
});

// This is just for testing in your browser
app.get("/", (req, res) => {
  res.send("AI Receptionist is running!");
});

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket connected.");

  ws.on("message", (message) => {
    console.log("Received:", message.toString());
  });

  ws.on("close", () => {
    console.log("WebSocket disconnected.");
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
