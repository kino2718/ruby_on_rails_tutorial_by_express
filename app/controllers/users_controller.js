const express = require('express')
const router = express.Router()
const User = require('../models/user')
const applicationHelper = require('../helpers/application_helper')
const csrfHelper = require('../helpers/csrf_helper')
const sessionsHelper = require('../helpers/sessions_helper')

router.get('/', loggedInUser, async (req, res) => {
    await index(req, res)
})

router.get('/:userId', async (req, res) => {
    await show(req, res)
})

router.post('/', csrfHelper.verifyCsrfToken, async (req, res, next) => {
    await create(req, res, next)
})

router.get('/:userId/edit', loggedInUser, correctUser, async (req, res) => {
    await edit(req, res)
})

router.post('/:userId', csrfHelper.verifyCsrfToken, loggedInUser, correctUser, async (req, res) => {
    await update(req, res)
})

async function index(req, res) {
    const page = parseInt(req.query.page) || 1
    const perPage = 30
    const totalCount = await User.count()
    const totalPages = Math.ceil(totalCount / perPage)
    const offset = (page - 1) * perPage

    const users = await User.paginate(perPage, offset)
    res.render('users/index', { title: 'All users', users: users, pagination: { current: page, totalPages: totalPages } })
}

async function show(req, res) {
    const debugOutputParams = applicationHelper.getDebugOutputParams(req)
    if (debugOutputParams) res.locals.debugOutput += `, ${debugOutputParams}`

    const userId = req.params.userId
    const user = await User.find(userId)
    res.render('users/show', { title: user.name, user: user })
}

function newUser(req, res) {
    const user = new User()
    res.render('users/new', { title: 'Sign up', user: user })
}

async function create(req, res, next) {
    const userParams = req.body.user
    const user = new User(userParams)
    if (await user.save()) {
        // session idをリセット
        req.session.regenerate(err => {
            if (err) {
                next(err)
                return
            }
            // ログイン
            sessionsHelper.logIn(req.session, user)

            // flashの設定
            req.flash('success', 'Welcome to the Sample App!')

            // ユーザ画面にredirectする
            let baseUrl = req.baseUrl
            if (baseUrl.at(-1) !== '/') baseUrl += '/'
            res.redirect(`${baseUrl}${user.id}`)
        })
    } else {
        res.status(422).render('users/new', { title: 'Sign up', user: user })
    }
}

async function edit(req, res) {
    const userId = req.params.userId
    const user = await User.find(userId)
    res.render('users/edit', { title: 'Edit user', user: user })
}

async function update(req, res) {
    const userId = req.params.userId
    const user = await User.find(userId)
    const userParams = req.body.user
    if (await user.update(userParams)) {
        // flashの設定
        req.flash('success', 'Profile updated')

        // ユーザ画面にredirectする
        let baseUrl = req.baseUrl
        if (baseUrl.at(-1) !== '/') baseUrl += '/'
        res.redirect(`${baseUrl}${user.id}`)
    } else {
        res.status(422).render('users/edit', { title: 'Edit user', user: user })
    }
}

async function loggedInUser(req, res, next) {
    if (! await sessionsHelper.hasLoggedIn(req)) {
        // urlを保存
        sessionsHelper.storeLocation(req)
        // flash の設定
        req.flash('danger', 'Please log in.')
        // log in画面にredirect
        res.redirect('/login')
    } else {
        next()
    }
}

async function correctUser(req, res, next) {
    const userId = req.params.userId
    const user = await User.find(userId)
    if (! await sessionsHelper.isCurrentUser(req, user)) {
        // root画面にredirect
        res.redirect('/')
    } else {
        next()
    }
}

module.exports = {
    router,
    newUser,
}
