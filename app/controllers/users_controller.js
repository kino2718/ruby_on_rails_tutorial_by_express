const express = require('express')
const router = express.Router()
const User = require('../models/user')
const application_helper = require('../helpers/application_helper')

router.get('/:userId', async (req, res, next) => {
    await show(req, res)
})

function new_user(req, res) {
    res.render('users/new', { title: 'Sign up', debugOutput: req.debugOutput })
}

async function show(req, res) {
    const debugOutputParams = application_helper.getDebugOutputParams(req)
    if (debugOutputParams) req.debugOutput += `, ${debugOutputParams}`

    const userId = req.params.userId
    const user = await User.find(userId)
    res.render('users/show', { title: undefined, user: user, debugOutput: req.debugOutput })
}

module.exports = {
    router,
    new_user,
}
