import express from "express"
const router = express.Router()
import { handleGetQuestion } from "../controller/question.js"
router.route('/')
  .get(handleGetQuestion)

export default router