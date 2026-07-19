const WebSocket = require("ws");

function setupConversationRelay(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url === "/conversation-relay") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", (ws) => {
    console.log("Twilio ConversationRelay connected");

    ws.on("message", (message) => {
      console.log("Message from Twilio:");
      console.log(message.toString());

      const data = JSON.parse(message.toString());

      if (data.type === "setup") {
        console.log("Call setup received");
      }

      if (data.type === "prompt") {
        ws.send(
          JSON.stringify({
            type: "text",
            token: "I am your AI receptionist. How can I help you today?",
          })
        );
      }
    });

    ws.on("close", () => {
      console.log("Twilio disconnected");
    });
  });
}

module.exports = {
  setupConversationRelay,
};
