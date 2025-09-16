const express = require('express')
const router = express.Router()

router.get('/signup', (req, res) => {
    new_user(req, res)
})

function new_user(req, res) {
    res.render('users/new', { title: 'Sign up' })
}

module.exports = {
    router,
}
