import express from 'express'
import {handleGetAllMessage, handleGetRecentCs} from '../controller/client'
const router = express.Router()
router.route('/message')
  .get(handleGetAllMessage)
router.route('/cs/recent')
  .get(handleGetRecentCs)

export default router