const db = require('../config/db');
const checkType = require('../function/index').handleCheckType;
exports.handleAddClientMember = async(req, res, next) => {
  const { uuid, name, identity, web_resource } = req.body;
  if(!(checkType(uuid, 'string') && checkType(name, 'string') && checkType(identity, 'number') && checkType(web_resource, 'number'))){
    res.status(400).send()
    return
  }
  // 先用uuid找看看有沒有共同uuid，有的話表示會員已建立過
  const checkMemberSyntax = `SELECT id FROM client_user WHERE uuid = '${uuid}'`;
  const createMemberSyntax = `INSERT INTO client_user (web_resource, uuid, name, identity) VALUES (${web_resource}, '${uuid}', '${name}', ${identity});`
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