const express = require('express')
const router = express.Router()
const User = require('../models/user')
const applicationHelper = require('../helpers/application_helper')
const csrfHelper = require('../helpers/csrf_helper')
const sessionsHelper = require('../helpers/sessions_helper')

router.get('/:userId', async (req, res) => {
    await show(req, res)
})

router.post('/', csrfHelper.verifyCsrfToken, async (req, res, next) => {
    await create(req, res, next)
})

router.get('/:userId/edit', async (req, res) => {
    await edit(req, res)
})

router.post('/:userId', (req, res) => {
    update(req, res)
})

async function show(req, res) {
    const debugOutputParams = applicationHelper.getDebugOutputParams(req)
    if (debugOutputParams) res.locals.debugOutput += `, ${debugOutputParams}`

    const userId = req.params.userId
    const user = await User.find(userId)
    res.render('users/show', { title: user.name, user: user })
}

function newUser(req, res) {
    const user = new User()
    res.render('users/new', { title: 'Sign up', user: user })
}

async function create(req, res, next) {
    const userParams = req.body.user
    const user = new User(userParams)
    if (await user.save()) {
        // session idをリセット
        req.session.regenerate(err => {
            if (err) {
                next(err)
                return
            }
            // ログイン
            sessionsHelper.logIn(req.session, user)

            // flashの設定
            req.flash('success', 'Welcome to the Sample App!')

            // ユーザ画面にredirectする
            let baseUrl = req.baseUrl
            if (baseUrl.at(-1) !== '/') baseUrl += '/'
            res.redirect(`${baseUrl}${user.id}`)
        })
    } else {
        res.status(422).render('users/new', { title: 'Sign up', user: user })
    }
}

async function edit(req, res) {
    const userId = req.params.userId
    const user = await User.find(userId)
    console.log('user: ', user)
    res.render('users/edit', { title: 'Edit user', user: user })
}

function update(req, res) {
    const userId = req.params.userId
    res.send(`update userId = ${userId}`)
}

module.exports = {
    router,
    newUser,
}
