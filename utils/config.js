/* eslint-disable linebreak-style */
require('dotenv').config()

const PORT = process.env.PORT
const MONGODB_URI = process.env.MONGODB_URI
const password = process.env.MONGODB_PASSWORD

module.exports = {
  MONGODB_URI,
  password,
  PORT
}