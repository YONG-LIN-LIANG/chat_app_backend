import db from '../config/db/mysql'
import {redis} from '../config/db/redis'
import { handleFormatTimestamp, handleFormatDateTime } from '../function/index'

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
  console.log('testtt', redisDB, client_id, group_name, website_name)
  const offlineSmessageList = await redisDB.lRange(`smessage-${client_id}-0`, 0, -1)
  console.log('offlineSmessageList', offlineSmessageList)
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
exports.handleGetAllMessage = async (req, res, next) => {
  const { client_id, resource_id } = req.query
  console.log('client_id', client_id, resource_id)
  // 取得網站來源的網站名稱及group名稱
  const getResourceInfoSyntax = `SELECT w.website_name, b.name as group_name FROM web_resource w left join business_group b on w.group_id = b.id where w.id=${resource_id}`;
  const getResourceInfo = await db.execute(getResourceInfoSyntax).then(res => res[0])
  const {website_name, group_name} = getResourceInfo[0]
  // 取得該會員所有房間
  const RoomSyntax = `SELECT a.id as cs_member_id, r.id as room_id, b.name as group_name, w.website_name, a.name as cs_name, r.begin_time ,r.end_time FROM room r left join administrator_user a on r.administrator = a.id left join client_user c on r.client = c.id left join web_resource w on r.resource_id = w.id left join business_group b on w.group_id = b.id where r.client=${client_id} order by r.begin_time;`
  // 檢查rooms的client有沒有自己
  const roomList = await db.execute(RoomSyntax).then(res => res[0])
  console.log('roomList', roomList)
  const redisDB = await redis()
  
  // getChatList()
  let data = []
  const offlineRoom = await handleGetOfflineSmessage(redisDB, client_id, group_name, website_name)
  
  // 取得目前已讀狀況
  const readState = await redisDB.get(`message-${client_id}-read`)

  const clientreadId = readState !== null ? readState.split(';')[1].split('-')[1] :0
  console.log('readState', readState)
  if((roomList.length || (offlineRoom !== null && offlineRoom.chatList.length))){
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
    console.log('offlineRoom', offlineRoom)
    if(offlineRoom !== null && offlineRoom.chatList.length){
      data.push(offlineRoom)
    }
    console.log('offlineMessageList', offlineRoom)
    res.status(200).send(data)
  }
  // 如果沒有roomList也沒有未配對系統訊息
  if(!roomList.length && offlineRoom === null){
    res.status(204).send()
  }
  await redisDB.disconnect()
  return
}

exports.handleGetRecentCs = async (req, res, next) => {
  const {member_id, resource_id} = req.query
  const getRecentCsSyntax = `SELECT a.id as administrator_id, a.name as administrator_name FROM room r left join administrator_user a on r.administrator = a.id where client = ${member_id} and r.resource_id = ${resource_id} and r.end_time is not null order by r.end_time desc limit 0,1`
  const getRecentCs = await db.execute(getRecentCsSyntax).then(res => res[0])
  if(getRecentCs.length){
    res.status(200).send(getRecentCs[0])
  }else {
    res.status(204).send()
  }
  return
}