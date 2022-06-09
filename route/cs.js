const express = require('express')
const router = express.Router()
const csController = require('../controller/cs')

router.route('/room/:cs_uuid')
  .get(csController.handleGetAllUserRoom)

router.route('/leader-board')
  .get(csController.handleGetLeaderBoard)

router.route('/leader-board/:cs_uuid')
  .get(csController.handleGetPersonalRating)

module.exports = router
