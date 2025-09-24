const express = require('express')
const router = express.Router()
const users_controller = require('./users_controller')

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

router.get('/signup', (req, res) => {
    users_controller.new_user(req, res)
})

function home(req, res) {
    res.render('static_pages/home', { title: undefined, debugOutput: req.debugOutput })
}

function help(req, res) {
    res.render('static_pages/help', { title: 'Help', debugOutput: req.debugOutput })
}

function about(req, res) {
    res.render('static_pages/about', { title: 'About', debugOutput: req.debugOutput })
}

function contact(req, res) {
    res.render('static_pages/contact', { title: 'Contact', debugOutput: req.debugOutput })
}

module.exports = {
    router,
}
