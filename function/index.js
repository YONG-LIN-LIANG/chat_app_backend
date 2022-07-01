exports.handleCheckType = (value, expectedResult) => {
  return typeof(value) === expectedResult
}
exports.handleFormatTimestamp = (time) => {
  return Math.floor(new Date(time) / 1000);
}
exports.handleFormatDateTime = (dateTime) => {
  return dateTime.
  replace(/T/, ' ').  
  replace(/\..+/, '') 
}
