require('dotenv').config() // 環境変数の設定
const express = require('express')
const path = require('path')
const staticPagesController = require('./controllers/static_pages_controller')
const usersController = require('./controllers/users_controller')
const sessionsController = require('./controllers/sessions_controller')
const accountActivationController = require('./controllers/account_activations_controller')
const applicationHelper = require('./helpers/application_helper')
const templatesHelper = require('./helpers/templates_helper')
const sessionsHelper = require('./helpers/sessions_helper')
const session = require('express-session')
const csrfHelper = require('./helpers/csrf_helper')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')

const app = express()

// set the directory of template files
app.set('views', path.join(__dirname, 'views'))
// set the template engine to ejs
app.set('view engine', 'ejs')

// set the root directory of static assets
app.use(express.static(path.join(__dirname, 'assets')))

// cookie の設定
const cookieSecret = process.env.COOKIE_SECRET
if (!cookieSecret) console.error('COOKIE_SECRET is not defined.')
app.use(cookieParser(cookieSecret))

// session の設定
let cookieSecure = false
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1) // 製品版(Render)でcookie.secure: trueが動作するために必要。
    cookieSecure = true
}
const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) console.error('SESSION_SECRET is not defined.')
app.use(session({
    secret: sessionSecret,              // セッションIDをハッシュ化するための秘密鍵（必須）
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
app.use(async (req, res, next) => {
    res.locals.title = undefined
    res.locals.debugOutput = applicationHelper.getDebugOutput(req)
    // 全ての画面でlog in状態かどうかを知る必要があるのでここで取得・設定する
    res.locals.hasLoggedIn = await sessionsHelper.hasLoggedIn(req)
    const currentUser = await sessionsHelper.currentUser(req)
    res.locals.currentUserId = currentUser ? currentUser.id : null
    next()
})

// register helper functions
app.locals.fullTitle = templatesHelper.fullTitle
app.locals.gravatarFor = templatesHelper.gravatarFor
app.locals.makeFormLabel = templatesHelper.makeFormLabel
app.locals.makeFormInput = templatesHelper.makeFormInput
app.locals.paginate = templatesHelper.paginate

// use express.Router
app.use('/', staticPagesController.router)
app.use('/users', usersController.router)
app.use('/', sessionsController.router)
app.use('/account_activations', accountActivationController.router)

module.exports = app
