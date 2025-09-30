function logIn(session, user) {
    session.userId = user.id
}

module.exports = {
    logIn,
}