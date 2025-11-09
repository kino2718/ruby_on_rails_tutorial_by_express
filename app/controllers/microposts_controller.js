const express = require('express')
const router = express.Router()
const csrfHelper = require('../helpers/csrf_helper')
const sessionsHelper = require('../helpers/sessions_helper')
const verifyCsrfToken = csrfHelper.verifyCsrfToken
const loggedInUser = sessionsHelper.loggedInUser

router.post('/', verifyCsrfToken, loggedInUser, async (req, res) => {
    await create(req, res)
})

router.post('/:id/delete', verifyCsrfToken, loggedInUser, async () => {
})

async function create(req, res) {
    const params = filterSafeParams(req.body.micropost)
    const user = await sessionsHelper.currentUser(req)
    const micropost = user.microposts.build(params)
    if (await micropost.save()) {
        req.flash('success', 'Micropost created!')
        res.redirect('/')
    } else {
        // pagination
        const page = parseInt(req.query.page) || 1
        const perPage = 30
        const offset = (page - 1) * perPage
        const feedItems = await user.feed(perPage, offset)
        const totalCount = await user.feedCount()
        const totalPages = Math.ceil(totalCount / perPage)
        const feedUsers = []
        for (const m of feedItems) {
            feedUsers.push(await m.user())
        }
        res.status(422).render('static_pages/home', {
            micropost: micropost, feedItems: feedItems, feedUsers: feedUsers, pagination: { current: page, totalPages: totalPages }
        })
    }
}

function filterSafeParams(params) {
    const filtered = {}
    filtered.content = params.content
    return filtered
}

module.exports = {
    router,
}
