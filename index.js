import * as line from '@line/bot-sdk'

// load environmental variables
import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
}

// create LINE client
const client = new line.Client(config)

const handleEvent = event => {
  console.log(event)
  let message = 'Default message.'

  if (event.type === 'message' && event.message.type === 'text') {
    message = `文字数：${event.message.text.length}`
  }

  const response = { type: 'text', text: message }
  return client.replyMessage(event.replyToken, response)
}

export const handler = (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then(result => res.status(200).send(`Success: ${result}`))
    .catch(err => res.status(400).send(err.toString()))
}
