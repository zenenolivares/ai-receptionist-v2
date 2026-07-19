const WebSocket = require("ws");
const OpenAI = require("openai");
const axios = require("axios");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Replace this with your n8n webhook URL
const N8N_WEBHOOK = "https://zenenolivares.app.n8n.cloud/webhook/hvac-lead";


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
      try {
        const data = JSON.parse(message.toString());

        console.log("Twilio:", data);


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
You are Sarah, the AI receptionist for CoolFlow HVAC, a professional HVAC company serving Texas.

Your job:
- Answer customer calls
- Qualify HVAC leads
- Collect customer information
- Help schedule service

Personality:
- Friendly
- Professional
- Calm
- Natural
- Helpful

You must collect:
- Customer name
- Phone number
- Address
- HVAC problem
- Urgency level
- Preferred callback time

Ask only one question at a time.

Important HVAC questions:
- Is the AC completely not working?
- Is there water leaking?
- Is there a burning smell?
- How old is the system?

Treat these as urgent:
- AC completely broken during extreme heat
- Electrical smell
- Active leaking
- Safety concerns

Never mention ChatGPT or OpenAI.

When you have collected all necessary information:

1. Say a normal closing statement to the customer.
2. Thank them for calling.
3. Let them know someone will follow up.

Example:
"Perfect, I have all the information I need. A technician will follow up with you shortly. Thank you for calling CoolFlow HVAC, and have a great day!"

After your closing statement, add the exact phrase LEAD_COMPLETE on a new line for the system to detect.
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


          // Send AI response back to caller
          ws.send(JSON.stringify({
            type: "text",
            token: text
          }));


          // Send lead to n8n once complete
          if (text.includes("LEAD_COMPLETE")) {

            try {

              await axios.post(N8N_WEBHOOK, {

                business: "CoolFlow HVAC",

                conversation: conversation,

                timestamp: new Date()

              });


              console.log("Lead sent to n8n");

            } catch (error) {

              console.log(
                "n8n webhook error:",
                error.message
              );

            }
          }

        }

      } catch(error) {

        console.log(
          "Conversation error:",
          error.message
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
