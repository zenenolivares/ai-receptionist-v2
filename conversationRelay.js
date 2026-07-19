const WebSocket = require("ws");

function setupConversationRelay(server) {
  const wss = new WebSocket.Server({
    server,
    path: "/conversation-relay",
  });

  wss.on("connection", (ws) => {
    console.log("Twilio ConversationRelay connected");

    ws.on("message", (message) => {
      const data = JSON.parse(message.toString());

      console.log("Twilio event:", data);

      if (data.type === "setup") {
        console.log("Call started:", data);
      }

      if (data.type === "prompt") {
        console.log("Caller said:", data.voicePrompt);
        
        ws.send(
          JSON.stringify({
            type: "text",
            token: "Thanks for calling. I am connecting you now.",
          })
        );
      }
    });

    ws.on("close", () => {
      console.log("ConversationRelay disconnected");
    });
  });
}

module.exports = {
  setupConversationRelay,
};
