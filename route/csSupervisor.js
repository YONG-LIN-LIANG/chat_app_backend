import express from 'express'
import { handleLogin, handleGetCsAuthWebsiteList } from '../controller/csSupervisor'
import { csSupervisorLoginMiddleware } from "../middleware/csSupervisorLogin"
import { checkAuthMiddleware } from "../middleware/tokenVerify"
const router = express.Router()
router.route("/token").post(csSupervisorLoginMiddleware, handleLogin)

router.route("/cs_auth_website").get(checkAuthMiddleware, handleGetCsAuthWebsiteList)
module.exports = router