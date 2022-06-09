const express = require('express')
const router = express.Router()
const memberController = require('../controller/member')

router.route('/client/add')
  .post(memberController.handleAddClientMember)



module.exports = router