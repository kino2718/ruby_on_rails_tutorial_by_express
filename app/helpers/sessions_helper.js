const User = require('../models/user')

const COOKIE_USER_ID = 'userId'
const COOKIE_REMEMBER_TOKEN = 'rememberToken'

function getCookieOptions(signed) {
    return {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 20,         // 20年
        httpOnly: true,                                 // JSからアクセス不可
        secure: process.env.NODE_ENV === 'production',  // 製品版ではHTTPSのみ送信
        sameSite: 'lax',                                // CSRF対策
        signed: signed                                  // 署名付き
    }
}

function logIn(session, user) {
    session.userId = user.id
}

async function remember(res, user) {
    await user.remember()
    res.cookie(COOKIE_USER_ID, user.id, getCookieOptions(true))
    res.cookie(COOKIE_REMEMBER_TOKEN, user.rememberToken, getCookieOptions(false))
}

let _currentUser = null
async function currentUser(req) {
    let userId = req.session.userId
    if (userId) {
        _currentUser = _currentUser || await User.find(userId)
        return _currentUser
    }
    userId = req.signedCookies.userId
    if (userId) {
        const user = await User.find(userId)
        const rememberToken = req.cookies.rememberToken
        if (user && user.isAuthenticated(rememberToken)) {
            logIn(req.session, user)
            _currentUser = user
            return currentUser
        }
    }
    return null
}

async function hasLoggedIn(req) {
    return !! await currentUser(req)
}

async function forget(res, user) {
    await user.forget()
    res.clearCookie(COOKIE_USER_ID)
    res.clearCookie(COOKIE_REMEMBER_TOKEN)
}

async function logOut(req, res, errorHandler) {
    const user = await currentUser(req)
    await forget(res, user)
    // sessionを破棄
    req.session.destroy(err => {
        errorHandler(err)
        return
    })
    // current userをリセット
    _currentUser = null
}

module.exports = {
    logIn,
    remember,
    currentUser,
    hasLoggedIn,
    forget,
    logOut,
}
