const Tokens = require('csrf')
const tokens = new Tokens()

// csrf token発行
function makeCsrfToken(req, res, next) {
    if (!req.session.csrfSecret) {
        // sessionにcsrfSecretを登録。これによりcsrf secretがsessionに紐付けされる
        // つまりsession idが漏れなければcsrf token自体が漏れても問題無い
        req.session.csrfSecret = tokens.secretSync()
    }
    res.locals.csrfToken = tokens.create(req.session.csrfSecret)
    next()
}

// csrf token検証
function verifyCsrfToken(req, res, next) {
    const token = req.body._csrf || req.query._csrf

    // sessionに登録したcsrf secretでtokenを検証
    if (!tokens.verify(req.session.csrfSecret, token)) {
        return res.status(403).send('invalid request')
    }
    next()
}

module.exports = {
    makeCsrfToken,
    verifyCsrfToken,
}
