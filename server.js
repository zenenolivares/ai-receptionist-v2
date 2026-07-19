const express = require("express");
const http = require("http");
const OpenAI = require("openai");
require("dotenv").config();

const { setupConversationRelay } = require("./conversationRelay");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

// Twilio Voice Webhook
app.post("/voice", (req, res) => {
  res.type("text/xml");

  res.send(`
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay
      url="wss://ai-receptionist-v2-sywe.onrender.com/conversation-relay"
      welcomeGreeting="Hello! Thanks for calling. How can I help you today?" />
  </Connect>
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
