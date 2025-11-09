const express = require('express')
const router = express.Router()
const usersController = require('./users_controller')
const sessionsHelper = require('../helpers/sessions_helper')

router.get('/', async (req, res) => {
    await home(req, res)
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

async function home(req, res) {
    // pagination
    const page = parseInt(req.query.page) || 1
    const perPage = 30
    const offset = (page - 1) * perPage
    let totalPages = 0

    let feedItems = []
    const feedUsers = []
    if (await sessionsHelper.hasLoggedIn(req)) {
        const user = await sessionsHelper.currentUser(req)
        feedItems = await user.feed(perPage, offset)
        const totalCount = await user.feedCount()
        totalPages = Math.ceil(totalCount / perPage)
        for (const m of feedItems) {
            feedUsers.push(await m.user())
        }
    }

    res.render('static_pages/home', {
        micropost: {}, feedItems: feedItems, feedUsers: feedUsers, pagination: { current: page, totalPages: totalPages }
    })
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
