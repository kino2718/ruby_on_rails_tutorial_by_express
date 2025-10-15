const express = require('express')
const router = express.Router()
const User = require('../models/user')
const csrfHelper = require('../helpers/csrf_helper')
const sessionsHelper = require('../helpers/sessions_helper')
const applicationHelper = require('../helpers/application_helper')

router.get('/login', (req, res) => {
    newSession(req, res)
})

router.post('/login', csrfHelper.verifyCsrfToken, async (req, res, next) => {
    await create(req, res, next)
})

router.post('/logout', csrfHelper.verifyCsrfToken, async (req, res, next) => {
    await destroy(req, res, next)
})

function newSession(req, res) {
    res.render('sessions/new', { title: 'Log in' })
}

async function create(req, res, next) {
    const debugOutputParams = applicationHelper.getDebugOutputParams(req)
    if (debugOutputParams) res.locals.debugOutput += `, ${debugOutputParams}`

    const sessionParams = req.body.session
    const users = await User.findBy({ email: sessionParams.email.toLowerCase() })
    if (users && users.length === 1) {
        const user = users[0]
        if (user.authenticate(sessionParams.password)) {
            const forwardingUrl = req.session.forwardingUrl
            // session idをリセット
            req.session.regenerate(async err => {
                if (err) {
                    next(err)
                    return
                }

                const rememberMe = sessionParams['remember_me']
                if (rememberMe === '1') await sessionsHelper.remember(res, user)
                else await sessionsHelper.forget(res, user)

                sessionsHelper.logIn(req.session, user)
                const url = forwardingUrl || `/users/${user.id}`
                res.redirect(url)
            })
            return
        }
    }
    // error処理
    // connect-flashパッケージのreq.flash(...)は使用しない。これはredirectした先でflashを表示する
    // 代わりに単にres.localsにflash objectを設定し、ejsでflash objectにアクセスできるようにする
    res.locals.flash = { danger: ['Invalid email/password combination'] }
    res.status(422).render('sessions/new', { title: 'Log in' })
}

async function destroy(req, res, next) {
    if (await sessionsHelper.hasLoggedIn(req)) {
        // ログアウト処理
        await sessionsHelper.logOut(req, res, err => {
            if (err) {
                next(err)
                return
            }
        })
    }
    // cookieを削除
    res.clearCookie('connect.sid')
    // rootへリダイレクト
    res.redirect('/')
}

module.exports = {
    router,
}
