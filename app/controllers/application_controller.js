const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    hello(req, res)
})

function hello(req, res) {
    res.send("hello, world!")
}

module.exports = router
