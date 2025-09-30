const User = require('../models/user')

function logIn(session, user) {
    session.userId = user.id
}

let _currentUser
function currentUser(session) {
    if (session.userId) {
        _currentUser = _currentUser || User.find(session.userId)
        return _currentUser
    }
    return null
}

module.exports = {
    logIn,
    currentUser,
}
