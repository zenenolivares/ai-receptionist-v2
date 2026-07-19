const express = require("express");
const http = require("http");
const OpenAI = require("openai");
require("dotenv").config();

const { setupConversationRelay } = require("./conversationRelay");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// Twilio Voice Webhook
app.post("/voice", (req, res) => {
  console.log("VOICE WEBHOOK HIT");
  
  res.type("text/xml");

  res.send(`
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


// Start WebSocket server
setupConversationRelay(server);


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
