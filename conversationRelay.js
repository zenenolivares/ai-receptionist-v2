const WebSocket = require("ws");

function setupConversationRelay(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("ConversationRelay connected.");

    ws.on("message", (message) => {
      console.log("Received:", message.toString());
    });

    ws.on("close", () => {
      console.log("ConversationRelay disconnected.");
    });
  });
}

module.exports = {
  setupConversationRelay,
};
