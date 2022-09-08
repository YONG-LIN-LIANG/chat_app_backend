import express from 'express'
import {
  handleGetAllUserRoom, 
  handleGetLeaderBoard, 
  handleGetPersonalRating, 
  handleGetResourceWebsiteList, 
  handleGetCommentList,
  handleCsLogin
} from '../controller/cs'
const router = express.Router()

router.route('/room/list/:cs_id')
  .get(handleGetAllUserRoom)

router.route('/leader-board')
  .get(handleGetLeaderBoard)

router.route('/personal-rating/all/:cs_id')
  .get(handleGetPersonalRating)

router.route('/personal-rating/resource')
  .get(handleGetResourceWebsiteList)

router.route('/personal-rating/list')
  .get(handleGetCommentList)

router.route('/token')
  .post(handleCsLogin)
export default router
