// @ts-check

require("dotenv").config()

const { createServer } = require("http")
const express = require("express")
const { WebClient } = require("@slack/web-api")
const { createEventAdapter } = require("@slack/events-api")

const web = new WebClient(process.env.SLACK_TOKEN)
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET
const slackEvents = createEventAdapter(slackSigningSecret)
const port = process.env.PORT || 8080

const CHANNELS_TO_EXCLUDE = [
  // 'C012K7XU4LE', // bot-testing
]

const CHANNELS_FOR_BUGS_WORKFLOW_REMINDER = [
  'C02E1D1G3B3', // #chr-test
  'C03N12SR0RK' // #product-bugs-and-feedback
]


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

async function handleThreadMessages(event) {
  // dont bother if the message is not from the question asker
  if (event.user !== event.parent_user_id) return

  // dont bother if the checkmark is there already
  if (await hasCheckmarkReaction(event.channel, event.thread_ts)) return

  // ONLY USE THIS WHEN DEBUGGING. REMOVE THIS AGAIN WHEN YOU ARE DONE. THIS IS LOGGED ON PAPERTRAIL, SO IT'S BETTER TO NOT HAVE THIS PRINTING THERE.
  // console.log(
  //   `Received a message event: user ${event.user} in channel ${event.channel} says ${event.text} at ${event.ts}`
  // )

  const text = event.text.toLowerCase()
  if (text === "solved") {
    console.log("mark it!")
    await addCheckmarkReaction(event.channel, event.thread_ts)
  } else if (/thank|^ty|solved/.test(text)) {
    await web.chat.postEphemeral({
      channel: event.channel,
      user: event.user,
      text: "Remember: You can mark this thread as solved by writing a message with just the word \"solved\" and I will mark it with ✅.",
      thread_ts: event.thread_ts,
    })
  }
}

async function handleMessagesForBugWorkflowReminder(event) {
  // Ignore channels that are not suited for the Bug Workflow Reminder
  if (!CHANNELS_FOR_BUGS_WORKFLOW_REMINDER.includes(event.channel)) return

  const issueWordsRegex = /(bug|issue|reproduce|complain|replicate)/i
  const ignoreWordsRegex = /feedback/i
  const reminderMessage = `Oops! 🐞\nIt seems you found a bug, <@${event.user}>. Please use the Product Bugs Report workflow. Thanks! 🙌`

  if (issueWordsRegex.test(event.text) && !ignoreWordsRegex.test(event.text)) {
    try {
      // Reply to the message in a thread
      await web.chat.postEphemeral({
        channel: event.channel,
        user: event.user,
        text: reminderMessage,
        thread_ts: event.thread_ts,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: reminderMessage
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '▶️  Report Bug',
                },
                style: 'primary',
                url: 'https://slack.com/shortcuts/Ft074LRBHCE6/8e9a1ef94c02a74bbb6e2aee43b22d87'
              }
            ]
          }
        ]
      });
    } catch (error) {
      console.error(error)
    }
  }
}

// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
slackEvents.on("message", async (event) => {
  // dont bother if its the channels we want to exclude
  if (CHANNELS_TO_EXCLUDE.includes(event.channel)) return

  if (event.thread_ts == null) {
    await handleMessagesForBugWorkflowReminder(event)
  } else {
    await handleThreadMessages(event)
  }
  
})

const app = express()

app.use("/slack/events", slackEvents.requestListener())

app.get("/health/ping", (req, res) => res.send("pong"))

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
