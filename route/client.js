import express from 'express'
import {handleGetRecentCs} from '../controller/client.js'
const router = express.Router()
router.route('/cs/recent')
  .get(handleGetRecentCs)

export default router