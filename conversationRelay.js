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

    let conversation = [];

    ws.on("message", async (message) => {
      const data = JSON.parse(message.toString());

      console.log(data);

      if (data.type === "prompt") {

        conversation.push({
          role: "user",
          content: data.voicePrompt
        });

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
You are Sarah, the AI receptionist for CallFlow HVAC.

Your job is to help customers with HVAC problems and collect the information needed for a technician to follow up.

Be friendly, professional, and conversational.

Start by understanding why they are calling.

Collect ONLY these details:

1. Customer name
2. Phone number
3. Service address
4. Description of the HVAC issue
5. Urgency (today, this week, general question)

Do NOT ask unnecessary questions.

Keep calls short and efficient.

Do not sound like a robot.
Do not mention AI.
Do not mention internal systems.

When you have enough information, say:

"Perfect, I have everything I need. A member of our team will reach out shortly. Thank you for calling CallFlow HVAC, and have a great day."

Never say:
LEAD_COMPLETE
lead complete
internal messages

`
            },
            ...conversation
          ]
        });


        const text = response.choices[0].message.content;

        conversation.push({
          role: "assistant",
          content: text
        });


        ws.send(JSON.stringify({
          type: "text",
          token: text
        }));


        // Send lead data to n8n after enough information is collected
        if (
          conversation.length >= 8 &&
          text.toLowerCase().includes("everything i need")
        ) {

          fetch("https://zenenolivares.app.n8n.cloud/webhook/hvac-lead", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              conversation: conversation
            })
          });

          console.log("Lead sent to n8n");

          setTimeout(() => {
            ws.send(JSON.stringify({
              type: "end"
            }));
          }, 5000);

        }
      }
    });


    ws.on("close", () => {
      console.log("Twilio disconnected");
    });

  });
}


module.exports = {
  setupConversationRelay,
};1
