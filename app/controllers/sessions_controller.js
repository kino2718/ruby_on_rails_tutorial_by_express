const express = require('express')
const router = express.Router()

router.get('/login', (req, res) => {
    newSession(req, res)
})

function newSession(req, res) {
    res.render('sessions/new', { title: undefined, debugOutput: req.debugOutput })
}

module.exports = {
    router,
}
