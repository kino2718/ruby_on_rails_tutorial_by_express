const cheerio = require('cheerio')

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
    logInAs,
}
