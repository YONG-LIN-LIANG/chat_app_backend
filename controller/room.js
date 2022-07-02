import db from '../config/db/mysql'
import {redis} from '../config/db/redis'
import { handleFormatDateTime } from '../function/index'

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
    res.status(201).send({...csInfo, room_id: roomId, first_message: firstMessageObj})
    await redisDB.disconnect()
    clearTimeout(firstMessageTimeOut)
    return
  }, 1000);
  
  
}