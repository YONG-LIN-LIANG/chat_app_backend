import express from 'express'
import {handleGetRecentCs} from '../controller/client'
const router = express.Router()
router.route('/cs/recent')
  .get(handleGetRecentCs)

export default router