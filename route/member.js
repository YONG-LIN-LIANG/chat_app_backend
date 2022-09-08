import express from 'express'
import {handleAddClientMember, handleAddCsMember, handleGetResourceInfo} from '../controller/member.js'
const router = express.Router()
router.route('/client/add')
  .post(handleAddClientMember)
router.route('/cs/add')
  .post(handleAddCsMember)
router.route('/resource/:resource_id')
  .get(handleGetResourceInfo)

export default router