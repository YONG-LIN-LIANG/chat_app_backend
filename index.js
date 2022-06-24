import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from './swagger.json';
import express from 'express';
const app = express()

// redis 範例用法 開始
// 指令: rpush `room-${roomId}` 'mano;hello world;2022-04-30 14:30:40'
// import {redis} from './config/db/redis'
// await redis()
// const setValue = async() => {
//   const db = await redis()
//   console.log('dbbb', db)
//   const result = await db.lRange('message-1', 0, -1)
//   console.log('result2', result)
// }

// setValue()
// redis 範例用法 結束

// api 路由
import clientRoute from './route/client'
import csRoute from './route/cs'
import memberRoute from './route/member'
import messageRoute from './route/message'
import roomRoute from './route/room'
import questionRoute from './route/question'
import tokenRoute from './route/token'
app.use(cors())
app.use(express.json())
app.use('/token', tokenRoute)
app.use('/client', clientRoute)
app.use('/cs', csRoute)
app.use('/member', memberRoute)
app.use('/message', messageRoute)
app.use('/room', roomRoute)
app.use('/question', questionRoute)
// const specs = swaggerJsDoc(options)
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerJsDoc))
// 中介攔截錯誤
app.use((err, req, res, next) => {
  console.log(err.code)
  res.status(500).json({
    message: 'Something went wrong'
  })
})

app.listen(process.env.PORT, () => {
  console.log(`running on ${process.env.PORT}`)
})