const express = require('express')
const router = express.Router()
const usersController = require('./users_controller')

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
    usersController.newUser(req, res)
})

function home(req, res) {
    res.render('static_pages/home')
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
