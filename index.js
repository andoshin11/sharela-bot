import * as line from '@line/bot-sdk'
const admin = require('firebase-admin')
import serviceAccount from '../firebase-secret-key.json'

// load environmental variables
import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
}

// setup Firestore
console.log('getting config.json')
//console.log(functions.config())
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.fireStore()

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

      // handle postback
      return replyText(event.replyToken, `Why no match? ${data.match(/^action=([a-z]+)/)}`)
      if (data.match(/^action=([a-z]+)/)) {
        const action = data.match(/^action=([a-z]+)/)[1]
        return handleAction(action, event.replyToken, event.source)
      } else {
        return replyText(event.replyToken, `Got postback: ${data}`)
      }
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
              `User ID: ${source.userId}`,
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

// handle actions
const handleAction = (action, replyToken, source) => {
  switch (action) {
    case 'show':
      if (!source.userId) return replyText(replyToken, `ユーザーIDが取得できませんでした。友達登録をしてください。`)

      let users = []
      db.collection('users').get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            users.push(doc.id)
          })
        })
        .then(
          replyText(replyToken, `ユーザーを取得しました: ${users}`)
        )
    default:
        return replyText(replyToken, '登録されていないアクションです')
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
