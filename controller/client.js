import db from '../config/db/mysql'
import {redis} from '../config/db/redis'
exports.handleGetAllMessage = async (req, res, next) => {
  const { client_id } = req.params
  console.log('client_id', typeof(client_id), client_id)
  // 取得該會員所有房間
  const RoomSyntax = `SELECT r.id as room_id, b.name as group_name, w.website_name, a.name as cs_name, r.end_time FROM room r left join administrator_user a on r.administrator = a.id left join client_user c on r.client = c.id left join web_resource w on c.web_resource = w.id left join business_group b on w.group_id = b.id where r.client=${client_id} order by r.begin_time;`
  // 檢查rooms的client有沒有自己
  const roomList = await db.execute(RoomSyntax).then(res => res[0])
  console.log('roomList', roomList)
 
  // getChatList()
  if(roomList.length){
     // const result = await db.set('key3', 'dadada')
  const redisDB = await redis()
  // 取得目前已讀狀況
  const readState = await redisDB.get(`message-${client_id}-read`)
  const clientreadId = readState.split(';')[1].split('-')[1]
  console.log('readState', readState)
  let data = []
  const handleFormatTimestamp = (time) => {
    return Math.floor(new Date(time) / 1000);
  }
  // 對每個房間跑迴圈
  for(let item of roomList){
    let roomObj = {
      roomId: item.room_id,
      group: item.group_name,
      website: item.website_name,
      csName: item.cs_name,
      isReadId: +clientreadId,
      end_time: item.end_time === null ? '' : item.end_time
    }
    // 取出該房間的聊天訊息
    let messageList = await redisDB.lRange(`message-${item.room_id}`, 0, -1)
    let smessageList = await redisDB.lRange(`smessage-${item.room_id}`, 0, -1)
    
    let chatList = []
    let sChatList = []
    for(let message of messageList) {
      const dataSplit = message.split(';')
      const identity = dataSplit[1].split('-')[0]
      const messageObj = {
        status: identity === 'cs' ? 1 : 2,
        msgId: +dataSplit[0],
        name: dataSplit[2],
        msg: dataSplit[3],
        created_time: dataSplit[4],
        timeStampDate: handleFormatTimestamp(dataSplit[4])
      }
      chatList.push(messageObj)
    }

    for(let smessage of smessageList) {
      const dataSplit = smessage.split(';')
      const questionId = dataSplit[1]
      let question_content= []
      question_content = questionId === 1 || questionId === 2 ? dataSplit[3].split(',') : dataSplit[3]
      const messageObj = {
        status: 0,
        question_id: +dataSplit[1],
        question: dataSplit[2],
        question_content: question_content,
        created_time: dataSplit[4],
        answer: dataSplit[5],
        timeStampDate: handleFormatTimestamp(dataSplit[4])
      }
      sChatList.push(messageObj)
    }
    const combineChatList = chatList.concat(sChatList).sort((a, b) => a.timeStampDate - b.timeStampDate)
    roomObj['chatList'] = combineChatList
    data.push(roomObj)
  }
    // roomList
    res.status(200).send(data)
    await redisDB.disconnect()
    return
  }else{
    return res.status(204).send()
  }
}