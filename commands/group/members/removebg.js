require('dotenv').config()
const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')
const removebgAPI = process.env.REMOVE_BG_KEY
const { writeFile } = require('fs/promises')

const { downloadContentFromMessage } = require('@adiwajshing/baileys')

const getRandom = ext => {
  return `${Math.floor(Math.random() * 10000)}${ext}`
}

module.exports.command = () => {
  let cmd = ['removebg', 'bg']
  return { cmd, handler }
}

const getRemoveBg = async Path => {
  const inputPath = `./${Path}`
  const formData = new FormData()
  formData.append('size', 'auto')
  formData.append(
    'image_file',
    fs.createReadStream(inputPath),
    path.basename(inputPath)
  )
  await axios({
    method: 'post',
    url: 'https://api.remove.bg/v1.0/removebg',
    data: formData,
    responseType: 'arraybuffer',
    headers: {
      ...formData.getHeaders(),
      'X-Api-Key': removebgAPI
    },
    encoding: null
  })
    .then(response => {
      if (response.status != 200) return console.log('error')
      fs.writeFileSync('./bg.png', response.data)
      console.log('DONE')
    })
    .catch(error => {
      return console.log('Error change api key')
    })
}

const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { type, content, sendMessageWTyping } = msgInfoObj

  const isTaggedImage =
    type === 'extendedTextMessage' && content.includes('imageMessage')

  if (isTaggedImage || msg.message.imageMessage) {
    let downloadFilePath
    if (msg.message.imageMessage) {
      downloadFilePath = msg.message.imageMessage
    } else {
      downloadFilePath =
        msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage
    }
    const stream = await downloadContentFromMessage(downloadFilePath, 'image')
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }
    const media = getRandom('.jpeg')
    await writeFile(media, buffer)
    getRemoveBg(media)
      .then(() => {
        try {
          sock
            .sendMessage(from, {
              image: fs.readFileSync('./bg.png'),
              mimetype: 'image/png',
              caption: `*Send by eva*`
            })
            .then(() => {
              try {
                fs.unlinkSync(media)
                fs.unlinkSync('./bg.png')
              } catch { }
            })
        } catch (err) {
          sendMessageWTyping(from, { text: err.toString() }, { quoted: msg })
        }
      })
      .catch(err => {
        console.log('Status : ', err.status)
        sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
      })
  } else {
    sendMessageWTyping(from, { text: `*Reply to image only*` }, { quoted: msg })
  }
}
