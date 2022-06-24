import { redis } from '../config/db/redis'
import { handleFormatDateTime } from '../function/index'
exports.handleReadMessage = async(req, res, next) => {

}

exports.handleSendMessage = async(req, res, next) => {
  const { identity } = req.body
  const redisDB = await redis()
  console.log('identity', identity)
  if(identity === 0) {
    const { memberId, roomId, questionId, question, questionContent, answer } = req.body
    // 處理系統訊息發送訊息
    if(roomId === 0) {
      // 處理未配對的系統訊息(目前還未有這狀況)
      // 建立smessage-memberId-0的redis陣列，
      const isRoomExist = await redisDB.get(`smessage-${memberId}-0`)
      
      if(isRoomExist === null) {
        const currentTime = handleFormatDateTime(new Date().toISOString())
        const message = `1;${questionId};${question};${questionContent};${currentTime};${answer}`
        console.log('messageee', message)
        const result = await redisDB.rPush(`smessage-${memberId}-0`, message)
        if(result === 1){
          // 塞值成功，返回成功
          return res.status(201).send()

        }
        console.log('result', result)
      }
      console.log('isRoomExist', isRoomExist)
    }else {
      // 處理已配對的系統訊息(目前還未有這狀況)
    }
    
  } else if (identity === 1) {
    // 處理系統訊息發送訊息
  } else {

  }
}