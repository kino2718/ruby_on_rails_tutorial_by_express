require('dotenv').config() // 環境変数の設定
const express = require('express')
const path = require('path')
const staticPagesController = require('./controllers/static_pages_controller')
const usersController = require('./controllers/users_controller')
const sessionsController = require('./controllers/sessions_controller')
const applicationHelper = require('./helpers/application_helper')
const templatesHelper = require('./helpers/templates_helper')
const session = require('express-session')
const csrfHelper = require('./helpers/csrf_helper')
const flash = require('connect-flash')

const app = express()

// set the directory of template files
app.set('views', path.join(__dirname, 'views'))
// set the template engine to ejs
app.set('view engine', 'ejs')

// set the root directory of static assets
app.use(express.static(path.join(__dirname, 'assets')))

// session の設定
const cookieSecure = process.env.NODE_ENV === 'production'
app.use(session({
    secret: process.env.SESSION_SECRET, // セッションIDをハッシュ化するための秘密鍵（必須）
    resave: false,                      // セッションに変更がなくても保存するか（false推奨）
    saveUninitialized: false,           // 初期化されていないセッションも保存するか（通常false）
    cookie: {
        secure: cookieSecure,           // HTTPSのみでcookieを送信する場合true
        httpOnly: true,                 // JSからアクセスできないようにする
        // クロスサイトからのフォーム送信や画像リクエストには Cookie が送信されない。GETでは送信。GETでデータ削除等あると危険。
        sameSite: 'lax',
    }
}))

// flash の設定
app.use(flash())
app.use((req, res, next) => {
    res.locals.flash = req.flash()
    next()
})

// フォームのPOSTデータを受け取るための設定
app.use(express.urlencoded({ extended: true }))  // x-www-form-urlencoded形式

// make csrf token
app.use(csrfHelper.makeCsrfToken)

// set some variables to the res.locals
app.use((req, res, next) => {
    res.locals.title = undefined
    res.locals.debugOutput = applicationHelper.getDebugOutput(req)
    next()
})

// register helper functions
app.locals.fullTitle = templatesHelper.fullTitle
app.locals.gravatarFor = templatesHelper.gravatarFor
app.locals.makeFormLabel = templatesHelper.makeFormLabel
app.locals.makeFormInput = templatesHelper.makeFormInput

// use express.Router
app.use('/', staticPagesController.router)
app.use('/users', usersController.router)
app.use('/', sessionsController.router)

module.exports = app
