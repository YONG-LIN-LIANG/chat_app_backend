import express from 'express'
import {handleGetAllUserRoom, handleGetLeaderBoard, handleGetPersonalRating} from '../controller/cs'
const router = express.Router()

router.route('/room/:cs_uuid')
  .get(handleGetAllUserRoom)

router.route('/leader-board')
  .get(handleGetLeaderBoard)

router.route('/leader-board/:cs_uuid')
  .get(handleGetPersonalRating)

export default router
