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
        res.status(422).render('static_pages/home', { micropost: micropost })
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
