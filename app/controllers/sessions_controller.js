const express = require('express')
const router = express.Router()

router.get('/login', (req, res) => {
    newSession(req, res)
})

function newSession(req, res) {
    res.render('sessions/new')
}

module.exports = {
    router,
}
