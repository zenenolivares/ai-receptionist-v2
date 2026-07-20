const express = require("express");
const http = require("http");
require("dotenv").config();

const { setupConversationRelay } = require("./conversationRelay");

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
      welcomeGreeting="Thanks for calling CallFlow HVAC. How can we help with your heating or cooling needs today?"
    />
  </Connect>
</Response>
  `);
});


// Health check
app.get("/", (req, res) => {
  res.send("AI Receptionist is running!");
});


const server = http.createServer(app);


// Start ConversationRelay WebSocket server
setupConversationRelay(server);


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
