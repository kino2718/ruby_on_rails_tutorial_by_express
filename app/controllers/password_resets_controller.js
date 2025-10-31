const express = require('express')
const router = express.Router()
const applicationHelper = require('../helpers/application_helper')
const csrfHelper = require('../helpers/csrf_helper')
const sessionsHelper = require('../helpers/sessions_helper')
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

router.post('/:resetToken', async (req, res, next) => {
    await update(req, res, next)
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
        if (checkExpiration(user)) {
            res.render('password_resets/edit', { title: 'Reset password', user: user, resetToken: token })
        } else {
            // 有効期限切れ
            expired(req, res)
        }
    }
    else {
        res.redirect('/')
    }
}

async function update(req, res, next) {
    const token = req.params.resetToken
    const email = req.body.email
    const user = await getUser(email)

    if (!validUser(user, token)) {
        res.redirect('/')
        return
    }

    const params = filterSafeParams(req.body.user)

    if (!params.password) {
        user.addError('password', "can't be empty")
        res.status(422).render('password_resets/edit', { title: 'Reset password', user: user, resetToken: token })
        return
    }

    if (await user.update(params)) {
        // session idをリセット
        req.session.regenerate(async err => {
            if (err) {
                next(err)
                return
            }

            sessionsHelper.logIn(req.session, user)
            req.flash('success', 'Password has been reset.')
            const url = `/users/${user.id}`
            res.redirect(url)
        })
    } else {
        res.status(422).render('password_resets/edit', { title: 'Reset password', user: user, resetToken: token })
    }
}

async function getUser(email) {
    if (!email) return null
    const users = await User.findBy({ email: email })
    return users?.at(0)
}

function validUser(user, token) {
    return user && user.activated && user.isAuthenticated('reset', token)
}

function checkExpiration(user) {
    return !user.isPasswordResetExpired()
}

function expired(req, res) {
    req.flash('danger', 'Password reset has expired.')
    const baseUrl = applicationHelper.getBaseUrl(req)
    res.redirect(`${baseUrl}/new`)
}

function filterSafeParams(params) {
    const filtered = {}
    filtered.password = params.password
    filtered.passwordConfirmation = params.passwordConfirmation
    return filtered
}

module.exports = {
    router,
}
