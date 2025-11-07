const express = require('express')
const router = express.Router()
const csrfHelper = require('../helpers/csrf_helper')
const sessionsHelper = require('../helpers/sessions_helper')
const verifyCsrfToken = csrfHelper.verifyCsrfToken
const loggedInUser = sessionsHelper.loggedInUser

router.post('/', verifyCsrfToken, loggedInUser, async () => {
})

router.post('/:id/delete', verifyCsrfToken, loggedInUser, async () => {
})

module.exports = {
    router,
}
