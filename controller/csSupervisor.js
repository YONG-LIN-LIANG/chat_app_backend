import db from '../config/db/mysql'
exports.handleLogin = (req, res, next) => {
  // 取得帳號密碼
  // 先打員工API
  // 成功後把員工API存在資料庫中並產生access token
  // 最後回傳使用者資料

}

exports.handleGetCsAuthWebsiteList = async (req, res, next) => {
  const { team_id } = req.user
  // 先取得所有網站清單
  const getWebsiteListSyntax = `SELECT id as resource_id, website_name FROM web_resource`
  const getWebsiteList = await db.execute(getWebsiteListSyntax).then(res => res[0])
  // 使用team_id找出底下同個team_id的客服
  const getCsAuthWebsiteListSyntax = `
    SELECT au.id as user_id, au.employee_no, au.name, arl.website_list, b.name as group_name FROM administrator_user au 
    left join administrator_resource_list arl on arl.administrator_id = au.id
    left join business_group b on b.id = arl.group_id
    where au.team_id = ${team_id} and arl.website_list is not null;
  `
  const getCsAuthWebsiteList = await db.execute(getCsAuthWebsiteListSyntax).then(res => res[0])
  if(getCsAuthWebsiteList.length) {
    const newCsAuthWebsiteList = getCsAuthWebsiteList.map(item => {
      const webIdList = item.website_list.split(",")
      let newWebList = []
      for(let id of webIdList) {
        // 遍歷webIdList
        newWebList.push(getWebsiteList.find(i => i.resource_id === +id))
      }
      delete item.website_list
      return {
        ...item,
        web_list: newWebList
      }
    })
    return res.status(200).send(newCsAuthWebsiteList)
  } else return res.status(204).send()
  
}