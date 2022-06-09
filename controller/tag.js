const db = require('../config/db');
const checkType = require('../function/index').handleCheckType;
exports.handleGetTagList = async(req, res, next) => {
  const {resource_id} = req.query
  console.log('checkk', typeof(req.query.resource_id))
  const getTagListSyntax = `SELECT id as tag_id, name FROM tag WHERE resource_id = ${resource_id}`
  const getTagList = await db.execute(getTagListSyntax).then(res => res[0])
  console.log('test', getTagList)
  if(getTagList.length){
    res.status(200).send(getTagList)
    return
  }
  res.status(204).send()
}