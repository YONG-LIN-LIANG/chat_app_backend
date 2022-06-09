const express = require('express')
const router = express.Router()
const tagController = require('../controller/tag')

router.route('/')
  .get(tagController.handleGetTagList)

module.exports = router