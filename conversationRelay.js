const WebSocket = require("ws");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const N8N_WEBHOOK =
  "https://zenenolivares.app.n8n.cloud/webhook/hvac-lead";


function setupConversationRelay(server) {

  const wss = new WebSocket.Server({
    noServer: true
  });


  server.on("upgrade", (request, socket, head) => {

    if (request.url === "/conversation-relay") {

      wss.handleUpgrade(
        request,
        socket,
        head,
        (ws) => {
          wss.emit("connection", ws);
        }
      );

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



          const response =
          await openai.chat.completions.create({

            model: "gpt-4o-mini",


            messages: [

              {
                role: "system",

                content: `
You are Sarah, the professional AI receptionist for LeadLock HVAC.

Your job is to help customers with heating and cooling issues and collect the information needed for a technician to follow up.

PERSONALITY:
- Friendly
- Professional
- Calm
- Natural
- Helpful

You should sound like a real receptionist, not a robot.

START OF CALL:
Begin with:
"Thanks for calling LeadLock HVAC. How can we help with your heating or cooling needs today?"

CONVERSATION RULES:
- Keep the conversation short.
- Ask one question at a time.
- Do not ask unnecessary questions.
- Do not repeat information the customer already provided.

COLLECT ONLY:

1. Customer name
2. Phone number
3. Service address
4. HVAC issue
5. Urgency of the problem
6. Best callback time

CALLBACK TIME:
Always ask:
"Is there a preferred time for our team to call you back?"

If the customer says they don't care, accept that and continue.

Do not make the callback question feel like an interview. Ask it naturally near the end after collecting the other information.

EXAMPLES:

If someone says:
"My AC isn't working."

Respond:
"I'm sorry you're dealing with that. I'll help get this started. May I get your name?"

If someone gives enough information:
Do not continue asking questions.

ENDING:
When you have collected the necessary information, say:

"Perfect, I have everything I need. A member of our team will reach out shortly. Thank you for calling LeadLock HVAC. Have a great day."

IMPORTANT:
Never say:
- LEAD_COMPLETE
- lead complete
- internal notes
- system messages
- that you are an AI

You are a helpful company receptionist.
`
              },


              ...conversation

            ]

          });



          const text =
          response.choices[0].message.content;



          conversation.push({

            role: "assistant",
            content: text

          });



          ws.send(JSON.stringify({

            type: "text",
            token: text

          }));



          // Send lead when conversation is complete

          if (

            conversation.length >= 8 &&

            text.toLowerCase()
            .includes("have a great day")

          ) {


            fetch(N8N_WEBHOOK, {

              method: "POST",

              headers: {

                "Content-Type": "application/json"

              },

              body: JSON.stringify({

                conversation: conversation

              })

            })

            .then(() => {

              console.log("Lead sent to n8n");

            })

            .catch((error) => {

              console.log(
                "n8n error:",
                error.message
              );

            });



            // End call after goodbye

            setTimeout(() => {

              ws.send(JSON.stringify({

                type: "end"

              }));

            }, 5000);


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

      console.log(
        "Twilio disconnected"
      );

    });


  });

}



module.exports = {

  setupConversationRelay

};
