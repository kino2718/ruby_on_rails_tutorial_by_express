const Tokens = require('csrf')
const tokens = new Tokens()

const CSRF_SECRET = 'csrf_secret'

// csrf token発行
function makeCsrfToken(req, res, next) {
    // cookieからcsrfSecretを取得
    let csrfSecret = req.cookies[CSRF_SECRET]
    if (!csrfSecret) {
        // 無ければcookieにcsrfSecretを登録
        csrfSecret = tokens.secretSync()
        res.cookie(CSRF_SECRET, csrfSecret, {
            httpOnly: true,                                 // JSからアクセス不可
            secure: process.env.NODE_ENV === 'production',  // 製品版ではHTTPSのみ送信
            sameSite: 'lax',                                // CSRF対策
        }
        )
    }
    res.locals.csrfToken = tokens.create(csrfSecret)
    next()
}

// csrf token検証
function verifyCsrfToken(req, res, next) {
    // csrf tokenを取得
    const token = req.body._csrf || req.query._csrf
    // cookieに登録したcsrf secretでtokenを検証
    const secret = req.cookies[CSRF_SECRET]
    if (!secret || !tokens.verify(secret, token)) {
        return res.status(403).send('invalid request')
    }
    next()
}

module.exports = {
    makeCsrfToken,
    verifyCsrfToken,
}
