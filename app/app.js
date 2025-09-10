const express = require('express')
const path = require('path')
const application_controller = require('./controllers/application_controller')
const static_pages_controller = require('./controllers/static_pages_controller')

const app = express()

// set the directory of template files
app.set('views', path.join(__dirname, 'views'));
// set the template engine to ejs
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  application_controller.hello(req, res)
})

app.get('/static_pages/home', (req, res) => {
  console.log('call home')
  static_pages_controller.home(req, res)
})

app.get('/static_pages/help', (req, res) => {
  static_pages_controller.help(req, res)
})

module.exports = app
