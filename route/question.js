const express = require('express')
const router = express.Router()
const questionController = require('../controller/question')

router.route('/')
  .get(questionController.handleGetQuestion)

module.exports = router