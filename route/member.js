import express from 'express'
import {handleAddClientMember, handleGetResourceInfo} from '../controller/member'
const router = express.Router()
router.route('/client/add')
  .post(handleAddClientMember)
router.route('/resource/:resource_id')
  .get(handleGetResourceInfo)

export default router