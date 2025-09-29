const express = require('express')
const router = express.Router()

router.get('/login', (req, res) => {
    newSession(req, res)
})

function newSession(req, res) {
    res.render('sessions/new', { title: 'Log in' })
}

module.exports = {
    router,
}
