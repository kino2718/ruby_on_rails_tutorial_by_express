const express = require('express')
const path = require('path')
const application_router = require('./controllers/application_controller')
const static_pages_router = require('./controllers/static_pages_controller')

const app = express()

// set the directory of template files
app.set('views', path.join(__dirname, 'views'));
// set the template engine to ejs
app.set('view engine', 'ejs')

// use express.Router
app.use('/', application_router)
app.use('/static_pages', static_pages_router)

module.exports = app
