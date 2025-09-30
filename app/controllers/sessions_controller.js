const express = require('express')
const router = express.Router()
const User = require('../models/user')
const csrfHelper = require('../helpers/csrf_helper')

router.get('/login', (req, res) => {
    newSession(req, res)
})

router.post('/login', csrfHelper.verifyCsrfToken, async (req, res) => {
    await create(req, res)
})

function newSession(req, res) {
    res.render('sessions/new', { title: 'Log in' })
}

async function create(req, res) {
    const sessionParams = req.body.session
    const users = await User.findBy({ email: sessionParams.email.toLowerCase() })
    if (users && users.length === 1) {
        const user = users[0]
        if (user.authenticate(sessionParams.password)) {
            res.send('authentication was successful')
            return
        }
    }
    // error処理
    // connect-flashパッケージのreq.flash(...)は使用しない。これはredirectした先でflashを表示する
    // 代わりに単にres.localsにflash objectを設定し、ejsでflash objectにアクセスできるようにする
    res.locals.flash = {danger: ['Invalid email/password combination']}
    res.status(422).render('sessions/new', { title: 'Log in' })
}
module.exports = {
    router,
}
