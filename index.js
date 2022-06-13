import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from './swagger.json';
import express from 'express';
const app = express()
import {redis} from './config/db/redis'
const setValue = async() => {
  const db = await redis()
  const result = await db.set('key3', 'dadada')
  console.log('result2', result)
}

setValue()

// api 路由
import clientRoute from './route/client'
import csRoute from './route/cs'
import memberRoute from './route/member'
import messageRoute from './route/message'
import roomRoute from './route/room'
import tagRoute from './route/tag'

app.use(cors())
app.use(express.json())

app.use('/client', clientRoute)
app.use('/cs', csRoute)
app.use('/member', memberRoute)
app.use('/message', messageRoute)
app.use('/room', roomRoute)
app.use('/tag', tagRoute)
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