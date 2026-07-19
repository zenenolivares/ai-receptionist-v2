const WebSocket = require("ws");

function setupConversationRelay(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    console.log("WebSocket upgrade request:", request.url);

    if (request.url === "/conversation-relay") {
      console.log("Accepting ConversationRelay connection");

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws) => {
    console.log("Twilio ConversationRelay connected");

    ws.on("message", (message) => {
      console.log("RAW MESSAGE:");
      console.log(message.toString());
    });

    ws.on("close", () => {
      console.log("Twilio disconnected");
    });

    ws.on("error", (err) => {
      console.log("WebSocket error:", err);
    });
  });
}

module.exports = {
  setupConversationRelay,
};
