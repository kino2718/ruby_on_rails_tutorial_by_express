const express = require('express')
const router = express.Router()
const applicationHelper = require('../helpers/application_helper')
const csrfHelper = require('../helpers/csrf_helper')
const User = require('../models/user')

router.get('/new', async (req, res) => {
    await newPasswordResets(req, res)
})

router.post('/', csrfHelper.verifyCsrfToken, async (req, res) => {
    await create(req, res)
})

router.get('/:resetToken/edit', async (req, res) => {
    await edit(req, res)
})

async function newPasswordResets(req, res) {
    res.render('password_resets/new', { title: 'Forgot password' })
}

async function create(req, res) {
    const email = req.body.password_reset.email
    const users = await User.findBy({ email: email })
    const user = users?.at(0)
    if (user) {
        await user.createResetDigest()
        const url = applicationHelper.getFullUrl(req)
        await user.sendPasswordResetEmail(url)
        req.flash('info', 'Email sent with password reset instructions')
        res.redirect('/')
    } else {
        res.locals.flash = { danger: ['Email address not found'] }
        res.status(422).render('password_resets/new', { title: 'Forgot password' })
    }
}

async function edit(req, res) {
    const token = req.params.resetToken
    const email = req.query.email
    const user = await getUser(email)
    if (validUser(user, token)) {
        res.render(`password_resets/edit`, { user, resetToken: token })
    }
    else {
        res.redirect('/')
    }
}

async function getUser(email) {
    const users = await User.findBy({ email: email })
    return users?.at(0)
}

function validUser(user, token) {
    return user && user.activated && user.isAuthenticated('reset', token)
}

module.exports = {
    router,
}
