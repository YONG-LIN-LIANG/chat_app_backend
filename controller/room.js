import db from '../config/db/mysql'
import {redis} from '../config/db/redis'
import { handleFormatDateTime, handleFormatTimestamp } from '../function/index'
exports.handleLeaveRoom = async(req, res, next) => {

}

exports.handlePair = async(req, res, next) => {
  const redisDB = await redis()
  const { client_id, cs_id, resource_id } = req.body
  // 檢查此會員是不是已配對中
  const isClientInRoomSyntax = `SELECT * FROM room where client = ${client_id} and end_time is null`
  const isClientInRoomRes = await db.execute(isClientInRoomSyntax).then(res => res[0])
  if(isClientInRoomRes.length) {
    // 此會員已在房間內，不進行配對
    res.status(400).send()
    return
  }
  console.log('client_id', client_id, 'cs_id', cs_id)
  let pairCsId = cs_id
  let csInfo = {}
  // 取得一位客服人員資料(member_id, name, socketId)
  if(cs_id === 0) {
    // 0為系統自動指派，先找一位客服(先隨便找)
    const getCsSyntax = `SELECT id as cs_id, name as cs_name FROM administrator_user where resource_id = ${resource_id} limit 0,1`
    const csInfoRes = await db.execute(getCsSyntax).then(res => res[0])
    console.log('csInfo', csInfo)
    csInfo = {
      cs_id: csInfoRes[0].cs_id,
      cs_name: csInfoRes[0].cs_name
    }
    pairCsId = csInfoRes[0].cs_id
  }
  const currentTime = handleFormatDateTime(new Date().toISOString())
  const createRoomSyntax = `INSERT INTO room (client, administrator, begin_time, resource_id) VALUES (${client_id}, ${pairCsId}, '${currentTime}', ${resource_id})`
  const roomId = await db.execute(createRoomSyntax).then(res => res[0].insertId)
  
  // 修改redis smessage-client-0 => smessage-roomId
  await redisDB.rename(`smessage-${client_id}-0`, `smessage-${roomId}`)
  // 發布人員第一則訊息(客服人員xxx在線為您服務)
  let messageId = await redisDB.lLen(`message-${roomId}`)
  messageId = messageId === 0 ? 1 : messageId++
  const firstMessage = `客服人員 ${csInfo.cs_name} 在線為您服務`
  const firstMessageTimeOut = setTimeout(async() => {
    const firstMessageTime = handleFormatDateTime(new Date().toISOString())
    await redisDB.rPush(`message-${roomId}`, `${messageId};cs-${csInfo.cs_id};${csInfo.cs_name};${firstMessage};${firstMessageTime}`)
    console.log('roomId', roomId)
    const firstMessageObj = {
      status: 1,
      messageId,
      name: csInfo.cs_name,
      memberId: csInfo.cs_id,
      message: firstMessage,
      createdTime: firstMessageTime
    }
    await redisDB.set(`message-${roomId}-read`, 'cs-0;client-0')
    res.status(201).send({...csInfo, room_id: roomId, first_message: firstMessageObj})
    await redisDB.disconnect()
    clearTimeout(firstMessageTimeOut)
    return
  }, 1000);
  
  
}

const handleFormatSystemMessage = (smessage) => {
  const dataSplit = smessage.split(';')
  // 從redis取出的資料都是字串，用+變為數字型態
  const questionId = +dataSplit[1]
  let question_content
  if(questionId === 1) {
    question_content = dataSplit[3].split(',')
  } else if (questionId === 2) {
    question_content = JSON.parse(dataSplit[3])
  }
  const messageObj = {
    status: 0,
    question_id: +dataSplit[1],
    question: dataSplit[2],
    question_content: question_content,
    created_time: dataSplit[4],
    answer: dataSplit[5],
    timeStampDate: handleFormatTimestamp(dataSplit[4])
  }
  return messageObj
}

exports.handleGetRoomMessage = async(req, res, next) => {
  // 客戶端才需要resource_id，客服端只需要client_id
  const { client_id } = req.query
  console.log('req.query', req.query)
  // 取得該會員所有房間
  const RoomSyntax = `SELECT a.id as cs_member_id, r.id as room_id, b.name as group_name, w.website_name, a.name as cs_name, r.begin_time ,r.end_time FROM room r left join administrator_user a on r.administrator = a.id left join client_user c on r.client = c.id left join web_resource w on r.resource_id = w.id left join business_group b on w.group_id = b.id where r.client=${client_id} order by r.begin_time;`
  // 檢查rooms的client有沒有自己
  const roomList = await db.execute(RoomSyntax).then(res => res[0])
  console.log('roomList', roomList)
  const redisDB = await redis()
  
  let data = []
  if(roomList.length){
    // 取得目前已讀狀況(登入後才需要)
    const readState = await redisDB.get(`message-${client_id}-read`)
    const clientreadId = readState !== null ? readState.split(';')[1].split('-')[1] :0
    // 對每個房間跑迴圈(roomId非0才會跑這，)
    for(let item of roomList){
      let roomObj = {
        room_id: item.room_id,
        group: item.group_name,
        website: item.website_name,
        cs_name: item.cs_name,
        cs_member_id: item.cs_member_id,
        is_read_id: +clientreadId,
        begin_time: item.begin_time === null ? '' : handleFormatDateTime(item.begin_time.toISOString()),
        end_time: item.end_time === null ? '' : handleFormatDateTime(item.end_time.toISOString())
      }
      // 取出該房間的聊天訊息
      let messageList = await redisDB.lRange(`message-${item.room_id}`, 0, -1)
      let smessageList = await redisDB.lRange(`smessage-${item.room_id}`, 0, -1)
      console.log('messageList', messageList)
      let chatList = []
      let sChatList = []
      // room裡的人員訊息
      for(let message of messageList) {
        const dataSplit = message.split(';')
        const member = dataSplit[1].split('-')
        const messageObj = {
          status: member[0] === 'cs' ? 1 : 2,
          message_id: +dataSplit[0],
          member_id: member[1],
          name: dataSplit[2],
          message: dataSplit[3],
          created_time: dataSplit[4],
          timeStampDate: handleFormatTimestamp(dataSplit[4])
        }
        console.log('messageObj', messageObj)
        chatList.push(messageObj)
      }
      // room裡的系統訊息
      for(let smessage of smessageList) {
        console.log('smessage', smessage)
        const messageObj = handleFormatSystemMessage(smessage)
        sChatList.push(messageObj)
      }
      const combineChatList = chatList.concat(sChatList).sort((a, b) => a.timeStampDate - b.timeStampDate)
      roomObj['chatList'] = combineChatList
      // data目前放的是完整的有開始及結束的聊天訊息
      data.push(roomObj)
    }
      // 有可能目前使用者有未配對系統聊天訊息(最新)，等完整的push完再push未配對訊息
    res.status(200).send(data)
  }
  // 如果沒有roomList也沒有未配對系統訊息
  if(!roomList.length){
    res.status(204).send()
  }
  await redisDB.disconnect()
  return
}