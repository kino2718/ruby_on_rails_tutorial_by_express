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
    res.render('static_pages/home', { title: "Home" })
}

function help(req, res) {
    res.render('static_pages/help', { title: "Help" })
}

function about(req, res) {
    res.render('static_pages/about', { title: "About" })
}

module.exports = router
