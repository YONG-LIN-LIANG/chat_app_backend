import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from './swagger.json';
import express from 'express';
const app = express()
// api 路由
import clientRoute from './route/client'
import csRoute from './route/cs'
import csSupervisorRoute from "./route/csSupervisor"
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
app.use('/cs_supervisor', csSupervisorRoute)
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