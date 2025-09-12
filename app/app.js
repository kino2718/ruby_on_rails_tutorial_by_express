const express = require('express')
const path = require('path')
const application_controller = require('./controllers/application_controller')
const static_pages_controller = require('./controllers/static_pages_controller')
const application_helper = require('./helpers/application_helper')

const app = express()

// set the directory of template files
app.set('views', path.join(__dirname, 'views'));
// set the template engine to ejs
app.set('view engine', 'ejs')
// register helper functions
app.locals.full_title = application_helper.full_title

// use express.Router
app.use('/', application_controller.router)
app.use('/static_pages', static_pages_controller.router)

module.exports = app
