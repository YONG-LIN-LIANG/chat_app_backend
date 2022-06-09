const express = require('express')
const router = express.Router()
const roomController = require('../controller/room')

router.route('/leave')
  .post(roomController.handleLeaveRoom)

router.route('/pair')
  .post(roomController.handlePair)

module.exports = router