const express = require('express')
const router = express.Router()
const User = require('../models/user')
const knexUtils = require('../db/knex_utils')
const knex = knexUtils.knex
const sessionsHelper = require('../helpers/sessions_helper')

router.get('/:activationToken/edit', async (req, res) => {
    await edit(req, res)
})

async function edit(req, res) {
    const token = req.params.activationToken
    const email = req.query.email
    const users = await User.findBy({ email: email })
    const user = users?.at(0)
    if (user && !user.activated && user.isAuthenticated('activation', token)) {
        user.updateAttribute('activated', true)
        user.updateAttribute('activatedAt', knex.fn.now())
        // login
        sessionsHelper.logIn(req.session, user)
        // flashの設定
        req.flash('success', 'Account activated!')
        // ユーザ画面にredirectする
        res.redirect(`/users/${user.id}`)
    } else {
        req.flash('danger', 'Invalid activation link')
        res.redirect('/')
    }
}

module.exports = {
    router,
}
