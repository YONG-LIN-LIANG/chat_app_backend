const handleCheckType = (value, expectedResult) => {
  return typeof(value) === expectedResult
}
const handleFormatTimestamp = (time) => {
  return Math.floor(new Date(time) / 1000);
}
const handleFormatDateTime = (dateTime) => {
  return dateTime.
  replace(/T/, ' ').  
  replace(/\..+/, '') 
}
const handleGetUnreadNum = async (redisDB, roomId, messageId, status) => {
  const identity = status === 1 ? 'cs' : 'client'
  const calculateMessageId = messageId ? messageId - 1 : 0
  // 先侷限範圍
  const getPeriodMessage = await redisDB.lRange(`message-${roomId}`, calculateMessageId, -1)
  // 再對清單篩選
  const unreadMessageList = getPeriodMessage.filter(i => {
    const messageSplit = i.split(';')
    const messageStatus = messageSplit[1].split('-')[0]
    const targetMessageId = +messageSplit[0]
    if(messageStatus !== identity && messageId !== targetMessageId) return i
  })
  return unreadMessageList.length
}

export { handleCheckType, handleFormatTimestamp, handleFormatDateTime, handleGetUnreadNum }