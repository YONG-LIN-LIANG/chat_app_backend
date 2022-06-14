import express from 'express'
import {handleLogin, handleLogout, handleRefresh} from '../controller/token'
const router = express.Router()
router.route('/')
  .post(handleLogin)
router.route('/logout')
  .post(handleLogout)
export default router