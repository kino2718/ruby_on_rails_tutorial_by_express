const express = require('express')
const router = express.Router()

router.get('/new', (req, res) => {
    new_user(req, res)
})

function new_user(req, res) {
    res.render('users/new', { title: undefined })
}

module.exports = {
    router,
}
