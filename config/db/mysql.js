import * as dotenv from 'dotenv'
dotenv.config();
import mysql from "mysql2"
console.log("test", process.env.DB_PORT)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD
})

export default pool.promise()