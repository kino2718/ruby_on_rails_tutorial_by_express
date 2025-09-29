const express = require('express')
const router = express.Router()
const User = require('../models/user')
const applicationHelper = require('../helpers/application_helper')
const csrfHelper = require('../helpers/csrf_helper')

router.get('/:userId', async (req, res) => {
    await show(req, res)
})

router.post('/', csrfHelper.verifyCsrfToken, async (req, res) => {
    await create(req, res)
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

async function create(req, res) {
    const userParams = req.body.user
    const user = new User(userParams)
    if (await user.save()) {
        // flashの設定
        req.flash('success', 'Welcome to the Sample App!')

        // ユーザ画面にredirectする
        let baseUrl = req.baseUrl
        if (baseUrl.at(-1) !== '/') baseUrl += '/'
        res.redirect(`${baseUrl}${user.id}`)
    } else {
        res.status(422).render('users/new', { title: 'Sign up', user: user })
    }
}

module.exports = {
    router,
    newUser,
}
