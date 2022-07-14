const express = require('express')
const router = express.Router()
const roomController = require('../controller/room')

router.route('/leave/:room_id')
  .put(roomController.handleLeaveRoom)

router.route('/pair')
  .post(roomController.handlePair)

router.route('/message')
  .get(roomController.handleGetRoomMessage)


module.exports = router