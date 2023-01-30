import db from '../config/db/mysql.js'
import { signJWT } from "../utils/jwt.utils.js"
export const csSupervisorLoginMiddleware = async (req, res, next) => {
  const { account, password } = req.body
  // 先檢查本地資料庫有無此筆資料，有的話直接產生accesstoken並回傳使用者資料
  const checkUserExistSyntax = `SELECT * FROM supervisor_user where account = '${account}' and password = '${password}'`
  const checkUserExist = await db.execute(checkUserExistSyntax).then(res => res[0])
  if(checkUserExist.length) {
    const { id, team_id, employee_no } = checkUserExist[0]
    const payload = { id, team_id, employee_no }
    const access = await signJWT(payload, "5m")
    const data = {...payload, access}
    return res.status(200).send(data)
  } else next()
}