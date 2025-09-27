const express = require('express')
const router = express.Router()
const User = require('../models/user')
const application_helper = require('../helpers/application_helper')
const csrfHelper = require('../helpers/csrf_helper')

router.get('/:userId', async (req, res) => {
    await show(req, res)
})

router.post('/', csrfHelper.verifyCsrfToken, async (req, res) => {
    await create(req, res)
})

async function show(req, res) {
    const debugOutputParams = application_helper.getDebugOutputParams(req)
    if (debugOutputParams) req.debugOutput += `, ${debugOutputParams}`

    const userId = req.params.userId
    const user = await User.find(userId)
    res.render('users/show', { title: user.name, user: user, debugOutput: req.debugOutput })
}

function new_user(req, res) {
    const user = new User()
    res.render('users/new', { title: 'Sign up', user: user, debugOutput: req.debugOutput })
}

async function create(req, res) {
    const userParams = req.body.user
    const user = new User(userParams)
    if (await user.save()) {
        // 保存の成功をここで扱う。
    } else {
        res.status(422).render('users/new', { title: 'Sign up', user: user, debugOutput: req.debugOutput })
    }
}

module.exports = {
    router,
    new_user,
}
