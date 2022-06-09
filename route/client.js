const express = require('express')
const router = express.Router()
const clientController = require('../controller/client')

router.route('/message/:client_uuid')
  .get(clientController.handleGetAllMessage)


module.exports = router