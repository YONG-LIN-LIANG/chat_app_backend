const express = require('express')
const router = express.Router()
const messageController = require('../controller/message')

router.route('/read')
  .post(messageController.handleReadMessage)

router.route('/send')
  .post(messageController.handleSendMessage)

module.exports = router