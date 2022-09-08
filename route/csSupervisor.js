import express from 'express'
import { handleLogin, handleGetCsAuthWebsiteList } from '../controller/csSupervisor.js'
import { csSupervisorLoginMiddleware } from "../middleware/csSupervisorLogin.js"
import { checkAuthMiddleware } from "../middleware/tokenVerify.js"
const router = express.Router()
router.route("/token").post(csSupervisorLoginMiddleware, handleLogin)

router.route("/cs_auth_website").get(checkAuthMiddleware, handleGetCsAuthWebsiteList)
export default router