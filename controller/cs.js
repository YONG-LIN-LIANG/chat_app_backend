import db from '../config/db/mysql'
import {redis} from '../config/db/redis'
import {handleGetUnreadNum, handleFormatTimestamp} from '../function/index'
// const handleGetUnreadNum = async (redisDB, roomId, messageId, status) => {
//   const identity = status === 1 ? 'cs' : 'client'
//   const calculateMessageId = messageId ? messageId - 1 : 0
//   // 先侷限範圍
//   const getPeriodMessage = await redisDB.lRange(`message-${roomId}`, calculateMessageId, -1)
//   // 再對清單篩選
//   const unreadMessageList = getPeriodMessage.filter(i => {
//     const messageSplit = i.split(';')
//     const messageStatus = messageSplit[1].split('-')[0]
//     const targetMessageId = +messageSplit[0]
//     if(messageStatus !== identity && messageId !== targetMessageId) return i
//   })
//   return unreadMessageList.length
// }
exports.handleGetAllUserRoom = async(req, res, next) => {
  const redisDB = await redis()
  const { cs_id } = req.params
  console.log('cs_iddd', cs_id)
  // 在room使用cs_id先撈出所有相關的room
  const getRoomListSyntax = `SELECT c.id as member_id, c.name, r.id as room_id, b.name as group_name, w.website_name as website FROM room r left join client_user c on r.client = c.id left join business_group b on r.resource_id = b.id left join web_resource w on r.resource_id = w.id where r.administrator = ${cs_id} and r.end_time is null;`
  const getRoomList = await db.execute(getRoomListSyntax).then(res => res[0])
  console.log('getRoomList', getRoomList)
  // 跑回圈拿到redis資料
  let room_list = []
  if(getRoomList.length) {
    for(let item of getRoomList) {
      // 先用room_id取得陣列
      const lastMessage = await redisDB.lIndex(`message-${item.room_id}`, -1)
      // 取得已讀狀況
      const readStatus = await redisDB.get(`message-${item.room_id}-read`)
      const dataSplit = lastMessage.split(';')
      const readMessageId = +readStatus.split(';')[0].split('-')[1]
      const message = dataSplit[3]
      const identity = dataSplit[1].split('-')[0]
      const messageStatus = identity === 'cs' ? 1 : 2
      const createdTime = dataSplit[4]
      const unread = await handleGetUnreadNum(redisDB, item.room_id, readMessageId, 1)
      room_list.push({
        member_id: item.member_id,
        name: item.name,
        message_status: messageStatus,
        message,
        created_time: createdTime,
        unread,
        room_id: item.room_id,
        group: item.group_name,
        website: item.website,
        timeStamp: handleFormatTimestamp(createdTime)
      })
    }
    room_list = room_list.sort((a, b) => b.timeStamp - a.timeStamp)
    res.status(200).send(room_list)
  }
  else res.status(204).send()
  await redisDB.disconnect()
  return
}

exports.handleGetLeaderBoard = async(req, res, next) => {

}

exports.handleGetPersonalRating = async(req, res, next) => {
  
}