const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    home(req, res)
})

router.get('/help', (req, res) => {
    help(req, res)
})

router.get('/about', (req, res) => {
    about(req, res)
})

router.get('/contact', (req, res) => {
    contact(req, res)
})

function home(req, res) {
    res.render('static_pages/home', { title: undefined })
}

function help(req, res) {
    res.render('static_pages/help', { title: 'Help' })
}

function about(req, res) {
    res.render('static_pages/about', { title: 'About' })
}

function contact(req, res) {
    res.render('static_pages/contact', { title: 'Contact' })
}

module.exports = {
    router,
}
