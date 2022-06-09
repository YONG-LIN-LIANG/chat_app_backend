require('dotenv').config()
const cors = require('cors')
const swaggerUI = require('swagger-ui-express')
const swaggerJsDoc = require('./swagger.json')
const express = require('express')
const app = express()

app.use(cors())
app.use(express.json())
app.use('/client', require('./route/client'))
app.use('/cs', require('./route/cs'))
app.use('/member', require('./route/member'))
app.use('/message', require('./route/message'))
app.use('/room', require('./route/room'))
app.use('/tag', require('./route/tag'))
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