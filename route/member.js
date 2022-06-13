import express from 'express'
import {handleAddClientMember} from '../controller/member'
const router = express.Router()
router.route('/client/add')
  .post(handleAddClientMember)

export default router