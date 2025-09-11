const express = require('express')
const router = express.Router()

router.get('/home', (req, res) => {
    console.log('call home')
    home(req, res)
})

router.get('/help', (req, res) => {
    help(req, res)
})

router.get('/about', (req, res) => {
    about(req, res)
})

function home(req, res) {
    res.render('static_pages/home')
}

function help(req, res) {
    res.render('static_pages/help')
}

function about(req, res) {
    res.render('static_pages/about')
}

module.exports = router
