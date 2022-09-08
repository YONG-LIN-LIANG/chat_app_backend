import { redis } from '../config/db/redis.js'
import { handleFormatDateTime, handleGetUnreadNum } from '../function/index.js'
const handleGetLatestReadMessageId = async (redisDB, status, roomId, historyReadId) => {
  const identity = status === 1 ? 'cs' : 'client'
  const messageList = await redisDB.lRange(`message-${roomId}`, historyReadId, -1)
  if(messageList.length) {
    const targetList = messageList.filter(i => {
      const messageSplit = i.split(';')
      const messageStatus = messageSplit[1].split('-')[0]
      const targetMessageId = +messageSplit[0]
      if(messageStatus !== identity && historyReadId !== targetMessageId) return i
    })
    if(!targetList.length) return null
    return targetList[targetList.length - 1].split(';')[0]
  } else return null
  
}
const handleReadMessage = async(req, res, next) => {
  const redisDB = await redis()
  // identity 用來判斷哪個對象實施已讀
  const { identity, room_id } = req.body
  // 先取得已讀訊息key-value
  const readState = await redisDB.get(`message-${room_id}-read`)
  const readStateSplit = readState.split(';')
  
  const readRecord = identity === 1 ? readStateSplit[0] : readStateSplit[1]
  const historyReadId = +readRecord.split('-')[1]
  let currentReadId = await handleGetLatestReadMessageId(redisDB, identity, room_id, historyReadId)
  // 這邊是如果已經已讀最新的訊息，就繼續用舊的messageId
  if(identity === 1 && currentReadId === null) {
    currentReadId = +readStateSplit[0].split('-')[1]
  } else if(identity === 2 && currentReadId === null) {
    currentReadId = +readStateSplit[1].split('-')[1]
  }
  // 更新message-roomId-read
  let newReadState
  if(identity === 1) {
    newReadState = `cs-${currentReadId};client-${+readStateSplit[1].split('-')[1]}`
  } else {
    newReadState = `cs-${+readStateSplit[0].split('-')[1]};client-${currentReadId}`
  }
  const result = await redisDB.set(`message-${room_id}-read`, `${newReadState}`)
  if(result === 'OK') {
    res.status(201).send({message_id: +currentReadId})
  } else {
    res.status(400).send()
  }
  // 回傳目前最新的message_id
  // 如果是客服端，取客戶端最新一條
  await redisDB.disconnect()
  return
}

const handleSendMessage = async(req, res, next) => {
  const { identity } = req.body
  const redisDB = await redis()
  if(identity === 0) {
    const date = new Date(+new Date() + 8 * 3600 * 1000)
    const { memberId, roomId, questionId, question, questionContent, answer } = req.body
    const currentTime = handleFormatDateTime(date.toISOString())
    let cs_id
    let formatQuestionContent
    formatQuestionContent = questionContent.toString()
    if(questionId === 1) {
      formatQuestionContent = questionContent.toString()
    } else if(questionId === 2) {
      formatQuestionContent = JSON.stringify(questionContent)
      cs_id = questionContent.find(i => i.name === answer).id
    }
    // 處理系統訊息發送訊息
    if(roomId === 0) {
      // 處理未配對的系統訊息(目前還未有這狀況)
      // 建立smessage-memberId-0的redis陣列，
      const message = `1;${questionId};${question};${formatQuestionContent};${currentTime};${answer}`
      const result = await redisDB.rPush(`smessage-${memberId}-0`, message)
      if(result){
        // 塞值成功，返回成功
        res.status(201).send({currentTime, cs_id})
      }
    }else {
      // 處理已配對的系統訊息(目前還未有這狀況)
    }
  } else if (identity === 1 || identity === 2) {
    // 處理人員發送訊息
    const date = new Date(+new Date() + 8 * 3600 * 1000)
    const currentTime = handleFormatDateTime(date.toISOString())
    const { identity, roomId, memberId, name, message } = req.body
    const status = identity === 1 ? `cs-${memberId}` : `client-${memberId}`
    const lastMessage = await redisDB.lRange(`message-${roomId}`, -1, -1)
    const messageId = +lastMessage[0].split(';')[0] + 1
    const messageInstance = `${messageId};${status};${name};${message};${currentTime}`
    const result = await redisDB.rPush(`message-${roomId}`, messageInstance)

    // 取得unread數量
    const readStatus = await redisDB.get(`message-${roomId}-read`)
    const readMessageId = +readStatus.split(';')[0].split('-')[1]
    const anotherIdentity = identity === 1 ? 2 : identity === 2 ? 1 : null
    const unread = await handleGetUnreadNum(redisDB, roomId, readMessageId, anotherIdentity)
    if(result){
      // 塞值成功，返回成功
      res.status(201).send({currentTime, messageId, unread})
    }
  } 
  await redisDB.disconnect()
  return
}

export { handleReadMessage, handleSendMessage}