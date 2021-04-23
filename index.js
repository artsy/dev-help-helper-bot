require('dotenv').config()

const { createServer } = require('http')
const express = require('express')
const { WebClient } = require('@slack/web-api')
const { createEventAdapter } = require('@slack/events-api')

const web = new WebClient(process.env.SLACK_TOKEN)
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET
const slackEvents = createEventAdapter(slackSigningSecret)
const port = process.env.PORT || 8080

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const addCheckmarkReaction = async (channel, timestamp) => {
	try {
		await web.reactions.add({ name: 'white_check_mark', channel, timestamp })
	} catch (error) {
		console.log(error)
	}
	console.log('done')
}

const CHANNELS = [
	'C012K7XU4LE', // bot-testing
	'CP9P4KR35', // dev-help
	'C02BAQ5K7', // practice-mobile
]

// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
slackEvents.on('message', async (event) => {
	// dont bother if its not the channels we care about
	if (!CHANNELS.includes(event.channel)) return

	// dont bother if its a top-level message in the channel
	if (event.thread_ts == null) return

	// dont bother if the message is not from the question asker
	if (event.user !== event.parent_user_id) return

	console.log(
		`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text} at ${event.ts}`,
	)
	//   console.log({event})
	if (event.text === 'solved') {
		console.log('mark it!')
		await addCheckmarkReaction(event.channel, event.thread_ts)
	} else if (
		event.text.includes('thanks') ||
		event.text.includes('thank you') ||
		event.text.includes('thank') ||
		event.text.startsWith('ty') ||
		event.text.includes('solved')
	) {
		await web.chat.postEphemeral({
			channel: event.channel,
			user: event.user,
			text:
				'Remember: You can mark this as solved by typing a message in this thread with a body of just `solved`.',
			thread_ts: event.thread_ts,
		})
	}
})

const app = express()

app.use('/slack/events', slackEvents.requestListener())

app.get('/health/ping', (req, res) => res.send('pong'))

// Initialize a server for the express app - you can skip this and the rest if you prefer to use app.listen()
const server = createServer(app)
server.listen(port, () => {
	// Log a message when the server is ready
	console.log(`Listening for events on ${server.address().port}`)
})
