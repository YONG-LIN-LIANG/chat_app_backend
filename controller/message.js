import { redis } from '../config/db/redis'
import { handleFormatDateTime } from '../function/index'
exports.handleReadMessage = async(req, res, next) => {

}

exports.handleSendMessage = async(req, res, next) => {
  const { identity } = req.body
  const redisDB = await redis()
  console.log('identity', identity)
  if(identity === 0) {
    console.log('reqq body', req.body)
    const { memberId, roomId, questionId, question, questionContent, answer } = req.body
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
      const currentTime = handleFormatDateTime(new Date().toISOString())
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
    
  } else if (identity === 1) {
    // 處理系統訊息發送訊息
  } else {

  }

  await redisDB.disconnect()
  return
}