import express from 'express'
import {handleGetAllMessage} from '../controller/client'
const router = express.Router()
router.route('/message/:client_id')
  .get(handleGetAllMessage)

export default router