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

// simple reply method
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts]
  return client.replyMessage(token, texts.map(text => ({ type: 'text', text })))
}

const handleEvent = event => {
  console.log(event)

  switch (event.type) {
    case 'message':
      const message = event.message
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken, event.source)
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`)
      }
    case 'follow':
      return replyText(event.replyToken, 'フォローありがとうございます！')
    case 'join':
      return replyText(event.replyToken, `${event.source.type}に参加しました`)
    case 'postback':
      let data = event.postback.data
      if (data === 'DATE' || data === 'TIME' || data == 'DATETIME') {
        data += `(${JSON.stringify(event.postback.params)})`
      }
      return replyText(event.replyToken, `Got postback: ${data}`)
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`)
  }
}

const handleText = (message, replyToken, source) => {
  switch (message.text) {
    case 'profile':
      if (source.userId) {
        return client.getProfile(source.userId)
          .then(profile => replyText(
            replyToken,
            [
              `Display name: ${profile.displayName}`,
              `Status message: ${profile.statusMessage}`
            ]
          ))
      } else {
        return replyText(replyToken, 'User IDを取得できませんでした')
      }
    default:
      return replyText(replyToken, message.text)
  }
}

export const handler = (req, res) => {
  // events must be an array
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end()
  }

  // handle events
  Promise
    .all(req.body.events.map(handleEvent))
    .then(result => res.status(200).send(`Success: ${result}`))
    .catch(err => res.status(400).send(err.toString()))
}
