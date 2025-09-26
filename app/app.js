const express = require('express')
const path = require('path')
const static_pages_controller = require('./controllers/static_pages_controller')
const users_controller = require('./controllers/users_controller')
const application_helper = require('./helpers/application_helper')
const users_helper = require('./helpers/users_helper')

const app = express()

// set the directory of template files
app.set('views', path.join(__dirname, 'views'))
// set the template engine to ejs
app.set('view engine', 'ejs')

// set the root directory of static assets
app.use(express.static(path.join(__dirname, 'assets')))

// フォームのPOSTデータを受け取るための設定
app.use(express.urlencoded({ extended: true }))  // x-www-form-urlencoded形式

// set debugOutput to the req
app.use((req, res, next) => {
    // 処理を追加
    req.debugOutput = application_helper.getDebugOutput(req)
    next()
})

// register helper functions
app.locals.full_title = application_helper.full_title
app.locals.gravatarFor = users_helper.gravatarFor
app.locals.makeFormLabel = users_helper.makeFormLabel
app.locals.makeFormInput = users_helper.makeFormInput

// use express.Router
app.use('/', static_pages_controller.router)
app.use('/users', users_controller.router)

module.exports = app
