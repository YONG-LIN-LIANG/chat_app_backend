import db from '../config/db/mysql'
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
