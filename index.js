import * as dotenv from 'dotenv'
dotenv.config();
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from './swagger.js';
// const swaggerJsDoc = require("./swagger.json")
import express from 'express';
const app = express()
// api 路由
import clientRoute from './route/client.js'
import csRoute from './route/cs.js'
import csSupervisorRoute from "./route/csSupervisor.js"
import memberRoute from './route/member.js'
import messageRoute from './route/message.js'
import roomRoute from './route/room.js'
import questionRoute from './route/question.js'
import tokenRoute from './route/token.js'
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
  res.status(500).json({
    message: 'Something went wrong'
  })
})

app.listen(process.env.PORT, () => {
  console.log(`running on ${process.env.PORT}`)
})