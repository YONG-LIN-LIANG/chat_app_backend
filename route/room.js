import express from "express"
const router = express.Router()
import { handleLeaveRoom, handlePair, handleGetRoomMessage } from "../controller/room.js"
router.route('/leave/:room_id')
  .put(handleLeaveRoom)

router.route('/pair')
  .post(handlePair)

router.route('/message')
  .get(handleGetRoomMessage)


export default router