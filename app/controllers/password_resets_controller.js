const express = require('express')
const router = express.Router()

router.get('/new', async (req, res) => {
    await newPasswordResets(req, res)
})

async function newPasswordResets(req, res) {
    res.render('password_resets/new')
}

module.exports = {
    router,
}
