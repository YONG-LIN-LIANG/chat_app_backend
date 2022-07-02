import { redis } from '../config/db/redis'
import { handleFormatDateTime } from '../function/index'
exports.handleReadMessage = async(req, res, next) => {

}

exports.handleSendMessage = async(req, res, next) => {
  const { identity } = req.body
  console.log('identity', identity)
  const redisDB = await redis()
  if(identity === 0) {
    console.log('reqq body', req.body)
    const { memberId, roomId, questionId, question, questionContent, answer } = req.body
    const currentTime = handleFormatDateTime(new Date().toISOString())
    let cs_id
    let formatQuestionContent
    console.log('questionCon', questionContent)
    formatQuestionContent = questionContent.toString()
    if(questionId === 1) {
      formatQuestionContent = questionContent.toString()
    } else if(questionId === 2) {
      formatQuestionContent = JSON.stringify(questionContent)
      cs_id = questionContent.find(i => i.name === answer).id
    }
    console.log('questionContenttt', formatQuestionContent, answer)
    // 處理系統訊息發送訊息
    if(roomId === 0) {
      // 處理未配對的系統訊息(目前還未有這狀況)
      // 建立smessage-memberId-0的redis陣列，
      const message = `1;${questionId};${question};${formatQuestionContent};${currentTime};${answer}`
      console.log('messageee', message)
      const result = await redisDB.rPush(`smessage-${memberId}-0`, message)
      if(result){
        // 塞值成功，返回成功
        res.status(201).send({currentTime, cs_id})

      }
      console.log('result', result)
      
    }else {
      // 處理已配對的系統訊息(目前還未有這狀況)
    }
  } else if (identity === 1 || identity === 2) {
    // 處理人員發送訊息
    const currentTime = handleFormatDateTime(new Date().toISOString())
    const { identity, roomId, memberId, name, message, messageId } = req.body
    console.log('7777', identity, roomId, memberId, name, message)
    const status = identity === 1 ? `cs-${memberId}` : `client-${memberId}`
    // let messageId = await redisDB.lLen(`message-${roomId}`)
    // messageId = messageId === 0 ? 1 : messageId++
    console.log('messageId', messageId)
    const messageInstance = `${messageId};${status};${name};${message};${currentTime}`
    const result = await redisDB.rPush(`message-${roomId}`, messageInstance)
    if(result){
      // 塞值成功，返回成功
      
      res.status(201).send({currentTime, messageId})

    }
    
  } 
  await redisDB.disconnect()
  return
}