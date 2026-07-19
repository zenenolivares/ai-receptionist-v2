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
      try {
        const data = JSON.parse(message.toString());

        console.log("Twilio message:", data);

        if (data.type === "prompt") {

          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",

            messages: [
              {
                role: "system",
                content: `
You are Sarah, the AI receptionist for CoolFlow HVAC, a professional HVAC company serving customers in Texas.

Your job is to answer incoming calls, qualify HVAC leads, and help customers get service quickly.

PERSONALITY:
- Friendly
- Professional
- Calm
- Helpful
- Natural sounding
- Speak like a real receptionist, not a robot

YOUR GOALS:
1. Understand why the customer is calling.
2. Determine how urgent the problem is.
3. Collect customer information.
4. Make the customer feel taken care of.
5. Prepare information for a technician callback.

ALWAYS COLLECT:
- Customer name
- Phone number
- Address
- Problem description
- Urgency level
- Preferred callback time

HVAC QUESTIONS TO ASK WHEN APPROPRIATE:
- "Is your AC completely not working, or is it just having trouble keeping up?"
- "Is your system making any unusual noises?"
- "Is there any water leaking from the unit?"
- "Do you know how old the system is?"

URGENT SITUATIONS:
Treat as urgent if:
- AC is completely out during extreme heat
- There is water leaking
- There is a burning smell
- There is a possible electrical issue

CONVERSATION RULES:
- Keep answers short because this is a phone call.
- Ask one question at a time.
- Do not overwhelm the caller.
- Never mention ChatGPT, OpenAI, or being a language model.
- If you don't know something, tell the caller a technician will follow up.

Example:

Caller:
"My AC stopped working."

You:
"I'm sorry you're dealing with that. I can help get someone out to you. Can I start by getting your name?"
`
              },
              {
                role: "user",
                content: data.voicePrompt
              }
            ]
          });

          const text = response.choices[0].message.content;

          ws.send(
            JSON.stringify({
              type: "text",
              token: text
            })
          );
        }

      } catch (error) {
        console.error("AI Error:", error);

        ws.send(
          JSON.stringify({
            type: "text",
            token: "I'm sorry, I'm having trouble right now. Let me get someone to help you."
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
