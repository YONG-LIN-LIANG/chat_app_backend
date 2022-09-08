import db from '../config/db/mysql.js'
import {redis} from '../config/db/redis.js'
import { handleFormatDateTime, handleFormatTimestamp, handleGetUnreadNum } from '../function/index.js'
const handleLeaveRoom = async(req, res, next) => {
  const { room_id } = req.params
  const { rating, comment, identity, is_room_already_close } = req.body
  let leaveRoomSyntax = ''
  const date = new Date(+new Date() + 8 * 3600 * 1000)
  const currentTime = handleFormatDateTime(date.toISOString())
  if(identity === 1) {
    // 只填上聊天室結束時間
    leaveRoomSyntax = `UPDATE room SET end_time='${currentTime}' where id = ${room_id}`
  } else if (identity === 2 && !is_room_already_close) {
    // 填上結束時間、rating、comment
    leaveRoomSyntax = `UPDATE room SET end_time='${currentTime}', rating=${rating}, comment='${comment}' where id = ${room_id}`
  } else if (identity === 2 && is_room_already_close) {
    // 填上rating、comment
    leaveRoomSyntax = `UPDATE room SET rating=${rating}, comment='${comment}' where id = ${room_id}`
  }
  const leaveRoomRes = await db.execute(leaveRoomSyntax).then(res => res[0])
  res.status(200).send(currentTime)
  // if(leaveRoomRes.changedRows) {
  //   // 表示已修改
  //   res.status(200).send(currentTime)
  // } else {
  //   // 無此房間
  //   res.status(400).send('無此房間')
  // }
}

const handlePair = async(req, res, next) => {
  const date = new Date(+new Date() + 8 * 3600 * 1000 + 2000)
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
  let getCsListSyntax = ''
  let getPairRoomSyntax = ''
  let pairCsId = cs_id
  let csInfo = {}
  // 取得一位客服人員資料(member_id, name, socketId)
  if(cs_id === 0) {
    // 0為系統自動指派，先找一位客服，配對給目前相對較沒會員配對的客服
    // getCsSyntax = `SELECT id as cs_id, name as cs_name FROM administrator_user where resource_id = ${resource_id} limit 0,1`
    // const csInfoRes = await db.execute(getCsSyntax).then(res => res[0])
    getCsListSyntax = `SELECT id as cs_id, name as cs_name FROM administrator_user where resource_id = ${resource_id}`;
    getPairRoomSyntax = `SELECT administrator as cs_id FROM room where resource_id = ${resource_id} and end_time is null`;
    let getCsListRes = await db.execute(getCsListSyntax).then(res => res[0])
    let getPairRoomRes = await db.execute(getPairRoomSyntax).then(res => res[0])
    for(let cs of getCsListRes) {
      cs.pairNum = 0
    }
    for(let room of getPairRoomRes) {
      getCsListRes.find(i => i.cs_id === room.cs_id).pairNum++
    }
    getCsListRes = getCsListRes.sort((a, b) => a.pairNum - b.pairNum)
    // 取得合適的cs
    csInfo = {
      cs_id: getCsListRes[0].cs_id,
      cs_name: getCsListRes[0].cs_name
    }
    pairCsId = getCsListRes[0].cs_id
  } else {
    const getCsSyntax = `SELECT name as cs_name FROM administrator_user where id = ${cs_id}`; 
    const csInfoRes = await db.execute(getCsSyntax).then(res => res[0])
    const cs_name = csInfoRes[0].cs_name
    csInfo = {
      cs_id,
      cs_name
    }
    pairCsId = cs_id
  }
  const currentTime = handleFormatDateTime(date.toISOString())
  const createRoomSyntax = `INSERT INTO room (client, administrator, begin_time, resource_id) VALUES (${client_id}, ${pairCsId}, '${currentTime}', ${resource_id})`
  const roomId = await db.execute(createRoomSyntax).then(res => res[0].insertId)
  
  // 修改redis smessage-client-0 => smessage-roomId
  await redisDB.rename(`smessage-${client_id}-0`, `smessage-${roomId}`)
  // 發布人員第一則訊息(客服人員xxx在線為您服務)
  let messageId = await redisDB.lLen(`message-${roomId}`)
  messageId = messageId === 0 ? 1 : messageId + 1
  const firstMessage = `客服人員 ${csInfo.cs_name} 在線為您服務`
  const firstMessageTimeOut = setTimeout(async() => {
    const firstMessageTime = handleFormatDateTime(date.toISOString())
    await redisDB.rPush(`message-${roomId}`, `${messageId};cs-${csInfo.cs_id};${csInfo.cs_name};${firstMessage};${firstMessageTime}`)
    const firstMessageObj = {
      status: 1,
      messageId,
      name: csInfo.cs_name,
      memberId: csInfo.cs_id,
      message: firstMessage,
      createdTime: firstMessageTime
    }
    await redisDB.set(`message-${roomId}-read`, 'cs-0;client-0')
    // 取得客戶端加入聊天室時，要加入客服端清單的object資訊
    const getNewRoomInfoSyntax = `SELECT c.name as name, w.website_name as website, b.name as group_name FROM room r left join client_user c on r.client = c.id left join web_resource w on w.id = r.resource_id left join business_group b on b.id = w.group_id where client = ${client_id} and end_time is null`
    const getNewRoomInfoRes = await db.execute(getNewRoomInfoSyntax).then(res => res[0])
    const {name, website, group_name} = getNewRoomInfoRes[0]
    const lastMessage = await redisDB.lIndex(`message-${roomId}`, -1)
    // 取得已讀狀況
    const readStatus = await redisDB.get(`message-${roomId}-read`)
    const dataSplit = lastMessage.split(';')
    const readMessageId = +readStatus.split(';')[0].split('-')[1]
    const message = dataSplit[3]
    messageId = +dataSplit[0]
    const identity = dataSplit[1].split('-')[0]
    const messageStatus = identity === 'cs' ? 1 : 2
    const createdTime = dataSplit[4]
    const unread = await handleGetUnreadNum(redisDB, roomId, readMessageId, 1)
    const roomInfo = {
      member_id: client_id,
      name,
      message_status: messageStatus,
      message,
      message_id: messageId,
      created_time: createdTime,
      unread,
      room_id: roomId,
      group: group_name,
      website,
    }
    res.status(201).send({...csInfo, room_id: roomId, first_message: firstMessageObj, cs_new_user_room: roomInfo})
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

const handleGetOfflineSmessage = async(redisDB, client_id, group_name, website_name) => {
  const offlineSmessageList = await redisDB.lRange(`smessage-${client_id}-0`, 0, -1)
  if(offlineSmessageList.length){
    let offlineChatList = []
    for(let smessage of offlineSmessageList) {
      const offlineMessage = handleFormatSystemMessage(smessage)
      offlineChatList.push(offlineMessage)
    }
    return {
      room_id: 0,
      group: group_name,
      website: website_name,
      cs_name: "",
      cs_uuid: "",
      is_read_id: 0,
      begin_time: "",
      end_time: "",
      chatList: offlineChatList
    }
  }
  return null
}

const handleGetRoomMessage = async(req, res, next) => {
  // 客戶端才需要resource_id，客服端只需要client_id
  const { client_id, resource_id } = req.query
  // 取得該會員所有房間
  const RoomSyntax = `SELECT a.id as cs_member_id, r.id as room_id, b.name as group_name, w.website_name, a.name as cs_name, r.begin_time ,r.end_time FROM room r left join administrator_user a on r.administrator = a.id left join client_user c on r.client = c.id left join web_resource w on r.resource_id = w.id left join business_group b on w.group_id = b.id where r.client=${client_id} order by r.begin_time;`
  // 檢查rooms的client有沒有自己
  const roomList = await db.execute(RoomSyntax).then(res => res[0])
  const redisDB = await redis()
  // 取得網站來源的網站名稱及group名稱(未配對時使用，當roomList最後一筆的end_time不為空時才需要打來源資料)
  // 表示目前未配對
  let offlineRoom
  if((roomList.length && roomList[roomList.length-1].end_time) || !roomList.length) {
    const getResourceInfoSyntax = `SELECT w.website_name, b.name as group_name FROM web_resource w left join business_group b on w.group_id = b.id where w.id=${resource_id}`;
    const getResourceInfo = await db.execute(getResourceInfoSyntax).then(res => res[0])
    const {website_name, group_name} = getResourceInfo[0]
    offlineRoom = await handleGetOfflineSmessage(redisDB, client_id, group_name, website_name)
  }
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
        chatList.push(messageObj)
      }
      // room裡的系統訊息
      for(let smessage of smessageList) {
        const messageObj = handleFormatSystemMessage(smessage)
        sChatList.push(messageObj)
      }
      const combineChatList = chatList.concat(sChatList).sort((a, b) => a.timeStampDate - b.timeStampDate)
      roomObj['chatList'] = combineChatList
      // data目前放的是完整的有開始及結束的聊天訊息
      data.push(roomObj)
    }
       // 有可能目前使用者有未配對系統聊天訊息(最新)，等完整的push完再push未配對訊息
    if(offlineRoom !== undefined && offlineRoom !== null && offlineRoom.chatList.length){
      data.push(offlineRoom)
    }
    res.status(200).send(data)
  } else if (!roomList.length && offlineRoom !== null && offlineRoom !== undefined) {
    data.push(offlineRoom)
    res.status(200).send(data)
  }
  // 如果沒有roomList也沒有未配對系統訊息
  else if(!roomList.length && (offlineRoom === null || offlineRoom === undefined)){
    res.status(204).send()
  }
  await redisDB.disconnect()
  return
}

export { handleLeaveRoom, handlePair, handleGetRoomMessage }