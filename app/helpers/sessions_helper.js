const User = require('../models/user')

function logIn(session, user) {
    session.userId = user.id
}

let _currentUser
async function currentUser(session) {
    if (session.userId) {
        _currentUser = _currentUser || await User.find(session.userId)
        return _currentUser
    }
    return null
}

async function hasLoggedIn(session) {
    return !! await currentUser(session)
}

module.exports = {
    logIn,
    currentUser,
    hasLoggedIn,
}
