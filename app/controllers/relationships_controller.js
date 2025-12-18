const express = require('express')
const router = express.Router()
const User = require('../models/user')
const Relationship = require('../models/relationship')
const sessionsHelper = require('../helpers/sessions_helper')
const loggedInUser = sessionsHelper.loggedInUser
const csrfHelper = require('../helpers/csrf_helper')
const verifyCsrfToken = csrfHelper.verifyCsrfToken

router.post('/', verifyCsrfToken, loggedInUser, async (req, res) => {
    await create(req, res)
})

router.post('/:id/delete', verifyCsrfToken, loggedInUser, async (req, res) => {
    await destroy(req, res)
})

async function create(req, res) {
    const followedId = req.body.followed_id
    const user = await User.find(followedId)
    const currentUser = await sessionsHelper.currentUser(req)
    currentUser.follow(user)
    res.redirect(`/users/${user.id}`)
}

async function destroy(req, res) {
    const relationshipId = req.params.id
    const rel = await Relationship.find(relationshipId)
    const user = await rel.followed()
    const currentUser = await sessionsHelper.currentUser(req)
    currentUser.unfollow(user)
    res.redirect(`/users/${user.id}`)
}

module.exports = {
    router,
}
