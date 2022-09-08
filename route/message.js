import express from "express"
const router = express.Router()
import { handleReadMessage, handleSendMessage } from "../controller/message.js"
router.route('/read')
  .post(handleReadMessage)

router.route('/send')
  .post(handleSendMessage)

export default router