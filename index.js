// @ts-check

require("dotenv").config()

const { createServer } = require("http")
const express = require("express")
const { WebClient } = require("@slack/web-api")
const { createEventAdapter } = require("@slack/events-api")
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
// const web = new WebClient(process.env.SLACK_TOKEN)
// const slackSigningSecret = process.env.SLACK_SIGNING_SECRET
// const slackEvents = createEventAdapter(slackSigningSecret)
const port = process.env.PORT || 8080

const addCheckmarkReaction = async (channel, timestamp) => {
  try {
    await web.reactions.add({ name: "white_check_mark", channel, timestamp })
  } catch (error) {
    console.log(error)
  }
  console.log("done")
}

const hasCheckmarkReaction = async (channel, timestamp) => {
  try {
    const response = await web.reactions.get({ channel, timestamp })
    if (
      response.message.reactions?.find(
        (reaction) => reaction.name === "white_check_mark"
      ) !== undefined
    ) {
      return true
    }
    return false
  } catch (error) {
    console.error(error)
    return false
  }
}

const CHANNELS_TO_EXCLUDE = [
  // 'C012K7XU4LE', // bot-testing
]

// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
// slackEvents.on("message", async (event) => {
//   // dont bother if its the channels we want to exclude
//   if (CHANNELS_TO_EXCLUDE.includes(event.channel)) return

//   // dont bother if its a top-level message in the channel
//   if (event.thread_ts == null) return

//   // dont bother if the message is not from the question asker
//   if (event.user !== event.parent_user_id) return

//   // dont bother if the checkmark is there already
//   if (await hasCheckmarkReaction(event.channel, event.thread_ts)) return

//   console.log(
//     `Received a message event: user ${event.user} in channel ${event.channel} says ${event.text} at ${event.ts}`
//   )

//   const text = event.text.toLowerCase()
//   if (text === "solved") {
//     console.log("mark it!")
//     await addCheckmarkReaction(event.channel, event.thread_ts)
//   } else if (
//     text.includes("thanks") ||
//     text.includes("thank you") ||
//     text.includes("thank") ||
//     text.startsWith("ty") ||
//     text.includes("solved")
//   ) {
//     await web.chat.postEphemeral({
//       channel: event.channel,
//       user: event.user,
//       text: "Remember: You can mark this thread as solved by writing a message with just the word \"solved\" and I will mark it with ✅.",
//       thread_ts: event.thread_ts,
//     })
//   }
// })

const app = express()

// app.use("/slack/events", slackEvents.requestListener())

app.get("/health/ping", (req, res) => res.send("pong"))

app.get("/notion/release-captains", async (req, res) => {
  const releaseCaptainPageId = 'e6dad1b81a0b41989da73a8087383b1d';
  try {
  // const response = await notion.pages.retrieve({ page_id: releaseCaptainPageId });
  const newPage = await notion.pages.create({
    "cover": {
      "type": "external",
      "external": {
          "url": "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg"
      }
  },
  "icon": {
      "type": "emoji",
      "emoji": "🥬"
  },
  "parent": {
      "type": "page_id",
      "page_id": "e6dad1b81a0b41989da73a8087383b1d",
  },
  "properties": {
  },
  "children": [
      {
          "object": "block",
          "heading_2": {
              "rich_text": [
                  {
                      "text": {
                          "content": "Lacinato kale"
                      }
                  }
              ]
          }
      },
      {
          "object": "block",
          "paragraph": {
              "rich_text": [
                  {
                      "text": {
                          "content": "Lacinato kale is a variety of kale with a long tradition in Italian cuisine, especially that of Tuscany. It is also known as Tuscan kale, Italian kale, dinosaur kale, kale, flat back kale, palm tree kale, or black Tuscan palm.",
                          "link": {
                              "url": "https://en.wikipedia.org/wiki/Lacinato_kale"
                          }
                      },
                      "href": "https://en.wikipedia.org/wiki/Lacinato_kale"
                  }
              ],
              "color": "default"
          }
      }
    ]
  })
  // const response = await notion.users.list({})
  console.log(newPage);
  } catch (e) {
    console.error(e)
  } finally {
    res.send("darn")
  }
})

app.get("/", (req, res) =>
  res.send(
    'nothing to see here. go to the <a href="https://github.com/artsy/dev-help-helper-bot">repo</a>.'
  )
)

// Initialize a server for the express app - you can skip this and the rest if you prefer to use app.listen()
const server = createServer(app)
server.listen(port, () => {
  // Log a message when the server is ready
  console.log(`Listening for events on ${server.address().port}`)
})
