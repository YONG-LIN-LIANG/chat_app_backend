const db = require('../config/db');
const checkType = require('../function/index').handleCheckType;
exports.handleAddClientMember = async(req, res, next) => {
  const { uuid, name, identity, web_resource } = req.body;
  if(!(checkType(uuid, 'string') && checkType(name, 'string') && checkType(identity, 'number') && checkType(web_resource, 'number'))){
    res.status(400).send()
    return
  }
  // 先用uuid找看看有沒有共同uuid，有的話表示會員已建立過
  const checkMember_syntax = `SELECT * FROM client_user WHERE uuid = '${uuid}'`;
  const createMember_syntax = `INSERT INTO client_user (web_resource, uuid, name, identity) VALUES (${web_resource}, '${uuid}', '${name}', ${identity});`
  let isMemberExist = await db.execute(checkMember_syntax)
  isMemberExist = isMemberExist[0].length
  if(!isMemberExist){
    await db.execute(createMember_syntax)
  }
  res.status(201).send()
}