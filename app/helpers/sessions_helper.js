const User = require('../models/user')

function logIn(session, user) {
    session.userId = user.id
}

let _currentUser = null
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

function logOut(session, errorHandler) {
    // sessionを破棄
    session.destroy(err => {
        errorHandler(err)
        return
    })
    // current userをリセット
    _currentUser = null
}

module.exports = {
    logIn,
    currentUser,
    hasLoggedIn,
    logOut,
}
