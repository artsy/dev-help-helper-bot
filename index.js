require('dotenv').config()

const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');

const web = new WebClient(process.env.SLACK_TOKEN)
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackEvents = createEventAdapter(slackSigningSecret);
const port = process.env.PORT || 8080;


const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const addCheckmarkReaction = async (timestamp) => {
	try {
		await web.reactions.add({ name: 'white_check_mark',
	channel: CHANNEL_BOT_TESTING,
	timestamp
 })
	} catch (error) {
		console.log(error)
	}
	console.log('done')
}

const CHANNEL_BOT_TESTING = 'C012K7XU4LE'
const CHANNEL_DEV_HELP = 'CP9P4KR35'

// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
slackEvents.on('message', async (event) => {
	// dont bother if its not the channel we care about
	if (event.channel !== CHANNEL_BOT_TESTING) return

	// dont bother if its a top-level message in the channel
	if (event.thread_ts == null) return

	// dont bother if the message is not from the question asker
	if (event.user !== event.parent_user_id) return

  console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text} at ${event.ts}`);
//   console.log({event})
  if (event.text === "solved") {
	  console.log('mark it!')
	  await addCheckmarkReaction(event.thread_ts)
  } else if (event.text.includes("thanks")||
  event.text.includes("thank you")||
  event.text.includes("solved")) {
	  await web.chat.postEphemeral({channel: event.channel, user: event.user, text: "Remember: You can mark this as solved by typing a message in this thread with a body of just `solved`.", thread_ts: event.thread_ts})
	}
});

(async () => {
  const server = await slackEvents.start(port);
  console.log(`Listening for events on ${server.address().port}`);
})();


