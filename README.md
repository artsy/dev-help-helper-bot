# `#dev-help` Helper Bot

This bot is marking thread that are solved by adding a ✅ on them.

## Meta

- **Slack App Link:** [Slack Bot App](https://api.slack.com/apps/A013FSQNV96)
- **Endpoint for Slack:** [Slack Bot App](https://dev-help-helper-bot-staging.artsy.net/slack/events)
- **Point People:** [@pvinis](https://github.com/pvinis)

## How to develop

- Make a `.env` file with the contents of `Slackbot dev-help-helper tokens` on 1Password.
- Run `yarn dev` to run the bot locally.
- Run `yarn ngrok` to expose the bot to the internet.
- Copy the first url from ngrok output, something like `https://14c3-108-54-246-210.ngrok.io -> http://localhost:8080`, so take the `https://14c3-108-54-246-210.ngrok.io` part.
- Go to https://api.slack.com/apps/A013FSQNV96/event-subscriptions and paste the link in the `Request URL` field, appending `/slack/events`, so in our example, `https://14c3-108-54-246-210.ngrok.io/slack/events`.
- Click `Save Changes` at the bottom of the page.
- **Make sure to put the previous endpoint for Slack back in that `Request URL` field. It's at the top of this file, but here is is again. https://dev-help-helper-bot-staging.artsy.net/slack/events**
- Click `Save Changes` at the bottom of the page.
