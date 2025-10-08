const cheerio = require('cheerio')

// rew, reqの変わりに使用する
function mock() {
    return {
        cookies: {},
        signedCookies: {},
        // eslint-disable-next-line no-unused-vars
        cookie: function (key, value, _options = {}) {
            // 簡単のためサイン有り無し両方に入れる
            this.cookies[key] = value
            this.signedCookies[key] = value
        },
        session: {}
    }
}

function isLoggedIn(mock) {
    const userId = mock.session.userId
    return !!userId
}

async function logInAs(agent, email, password, rememberMe = '1') {
    // loginにアクセスしてcrfs tokenを取得
    let res = await agent.get('/login')
    let $ = cheerio.load(res.text)
    let csrfToken = $('input[name="_csrf"]').val()

    return await agent
        .post('/login')
        .type('form')
        .send({
            _csrf: csrfToken,
            'session[email]': email,
            'session[password]': password,
            'session[remember_me]': rememberMe,
        })
}

module.exports = {
    mock,
    isLoggedIn,
    logInAs,
}
