const express = require("express");
const http = require("http");
const OpenAI = require("openai");
require("dotenv").config();

const { setupConversationRelay } = require("./conversationRelay");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

// Twilio webhook
app.post("/voice", (req, res) => {
  res.set("Content-Type", "text/xml");

  res.send(`
<Response>
  <Say voice="alice">
    Hello! Thanks for calling. Our A.I. receptionist will be with you shortly.
  </Say>
</Response>
  `);
});

// Browser test
app.get("/", (req, res) => {
  res.send("AI Receptionist is running!");
});

const server = http.createServer(app);

// Start the ConversationRelay WebSocket server
setupConversationRelay(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
