import db from '../config/db/mysql.js'
import {redis} from '../config/db/redis.js'
import {handleGetUnreadNum, handleFormatTimestamp} from '../function/index.js'
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
const handleGetAllUserRoom = async(req, res, next) => {
  const redisDB = await redis()
  const { cs_id } = req.params
  // 在room使用cs_id先撈出所有相關的room
  const getRoomListSyntax = `SELECT c.id as member_id, c.name, r.id as room_id, b.name as group_name, w.website_name as website FROM room r left join client_user c on r.client = c.id left join business_group b on r.resource_id = b.id left join web_resource w on r.resource_id = w.id where r.administrator = ${cs_id} and r.end_time is null;`
  const getRoomList = await db.execute(getRoomListSyntax).then(res => res[0])
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
      const messageId = +dataSplit[0]
      const identity = dataSplit[1].split('-')[0]
      const messageStatus = identity === 'cs' ? 1 : 2
      const createdTime = dataSplit[4]
      const unread = await handleGetUnreadNum(redisDB, item.room_id, readMessageId, 1)
      room_list.push({
        member_id: item.member_id,
        name: item.name,
        message_status: messageStatus,
        message,
        message_id: messageId,
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

const handleGetLeaderBoard = async(req, res, next) => {

}

const handleGetPersonalRating = async(req, res, next) => {
  const { cs_id } = req.params
  const getRatingListSyntax = `SELECT rating FROM room where administrator = ${cs_id} and end_time is not null;`
  const getRatingList = await db.execute(getRatingListSyntax).then(res => res[0])
  // getRatingList跑回圈區分每個星等的數量多少
  let rating = {
    '5': 0,
    '4': 0,
    '3': 0,
    '2': 0,
    '1': 0
  }
  for(let item of getRatingList) {
    rating[item.rating] = rating[item.rating] + 1
  }
  res.status(200).send(rating)
}

const handleGetResourceWebsiteList = async(req, res, next) => {
  const { group_id } = req.query
  let getListSyntax = ''
  if(!group_id) {
    getListSyntax = `SELECT id as group_id, name as group_name FROM business_group;`
  } else getListSyntax = `SELECT w.id as resource_id, w.website_name FROM business_group b left join web_resource w on b.id = w.group_id where w.group_id = ${group_id};`

  const getList = await db.execute(getListSyntax).then(res => res[0])
  res.status(200).send(getList)
}

const handleGetCommentList = async(req, res, next) => {
  const { cs_id, rating, key_word, resource_id, from_date, to_date, per_page_amount, sort } = req.query
}

const handleCsLogin = async (req, res, next) => {
  const { account, password } = req.body
  const loginSyntax = `SELECT id as member_id, resource_id, name as cs_name FROM administrator_user where account = "${account}" and password = "${password}";`
  const loginRes = await db.execute(loginSyntax).then(res => res[0])
  if(loginRes.length) {
    res.status(200).send(loginRes[0])
  } else {
    res.status(401).send("Unauthorized")
  }
  return
}

export { 
  handleGetAllUserRoom, 
  handleGetLeaderBoard, 
  handleGetPersonalRating, 
  handleGetResourceWebsiteList, 
  handleGetCommentList, 
  handleCsLogin 
}