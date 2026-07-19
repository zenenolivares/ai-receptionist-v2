const WebSocket = require("ws");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function setupConversationRelay(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url === "/conversation-relay") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws);
      });
    }
  });

  wss.on("connection", (ws) => {
    console.log("Twilio ConversationRelay connected");

    ws.on("message", async (message) => {
      const data = JSON.parse(message.toString());

      console.log(data);

      if (data.type === "prompt") {

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an AI receptionist. Be friendly, professional, and help callers schedule appointments or answer questions."
            },
            {
              role: "user",
              content: data.voicePrompt
            }
          ]
        });

        const text = response.choices[0].message.content;

        ws.send(JSON.stringify({
          type: "text",
          token: text
        }));
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
