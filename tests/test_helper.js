const cheerio = require('cheerio')
const User = require('../app/models/user')
const knexUtils = require('../app/db/knex_utils')
const knex = knexUtils.knex

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

async function setupUsers() {
    await knex('users').del()

    const users = {}

    users.michael = await User.create(
        {
            name: 'Michael Example',
            email: 'michael@example.com',
            password: 'password',
            passwordConfirmation: 'password',
            admin: true
        }
    )

    users.archer = await User.create(
        {
            name: 'Sterling Archer',
            email: 'duchess@example.gov',
            password: 'password',
            passwordConfirmation: 'password'
        }
    )

    users.lana = await User.create(
        {
            name: 'Lana Kane',
            email: 'hands@example.gov',
            password: 'password',
            passwordConfirmation: 'password'
        }
    )

    users.malory = await User.create(
        {
            name: 'Malory Archer',
            email: 'boss@example.gov',
            password: 'password',
            passwordConfirmation: 'password'
        }
    )

    for (let i = 0; i < 30; ++i) {
        users[`user_${i}`] = await User.create(
            {
                name: `User ${i}`,
                email: `user-${i}@example.com`,
                password: 'password',
                passwordConfirmation: 'password'
            }
        )
    }

    return users
}

module.exports = {
    mock,
    isLoggedIn,
    logInAs,
    setupUsers,
}
