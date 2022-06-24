import db from '../config/db/mysql'
import {handleCheckType} from '../function/index'
// const checkType = require('../function/index').handleCheckType;
exports.handleAddClientMember = async(req, res, next) => {
  const { uuid, name, identity } = req.body;
  if(!(handleCheckType(uuid, 'string') && handleCheckType(name, 'string') && handleCheckType(identity, 'number'))){
    res.status(400).send()
    return
  }
  // 先用uuid找看看有沒有共同uuid，有的話表示會員已建立過
  const checkMemberSyntax = `SELECT id FROM client_user WHERE uuid = '${uuid}'`;
  const createMemberSyntax = `INSERT INTO client_user (uuid, name, identity) VALUES ('${uuid}', '${name}', ${identity});`
  const getMember = await db.execute(checkMemberSyntax).then(res => res[0])
  const isMemberExist = getMember.length
  let memberId
  if(!isMemberExist){
    memberId = await db.execute(createMemberSyntax).then(res => res[0].insertId)
  }else{
    memberId = getMember[0].id
  }
  res.status(201).json({memberId})
}

exports.handleGetResourceInfo = async(req, res, next) => {
  const {resource_id} = req.params
  console.log('resource_id', resource_id)
  const getResourceInfoSyntax = `SELECT w.website_name, b.name as group_name FROM web_resource w left join business_group b on w.group_id = b.id where w.id=${resource_id}`;
  const getResourceInfo = await db.execute(getResourceInfoSyntax).then(res => res[0])
  console.log('getResourceInfo', getResourceInfo)
  if(getResourceInfo.length) {
    return res.status(200).send(getResourceInfo[0])
  }else{
    return res.status(400).send()
  }
}