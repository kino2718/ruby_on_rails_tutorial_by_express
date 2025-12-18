const cheerio = require('cheerio')
const { faker } = require('@faker-js/faker')
const User = require('../app/models/user')
const Relationships = require('../app/models/relationship')
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

function isLoggedInMock(mock) {
    const userId = mock.session.userId
    return !!userId
}

async function isLoggedIn(agent) {
    const res = await agent.get('/test/session')
    const userId = res.body.userId
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

async function saveOrGetUser(user) {
    const u = (await User.findBy({ email: user.email }))?.at(0)
    if (u) {
        Object.assign(user, u)
        user.setSaved()
    } else {
        await user.save()
    }
}

async function setupUsers() {
    const users = {}

    users.michael = new User(
        {
            name: 'Michael Example',
            email: 'michael@example.com',
            password: 'password',
            passwordConfirmation: 'password',
            admin: true,
            activated: true,
            activatedAt: knex.fn.now()
        }
    )
    await saveOrGetUser(users.michael)

    users.archer = new User(
        {
            name: 'Sterling Archer',
            email: 'duchess@example.gov',
            password: 'password',
            passwordConfirmation: 'password',
            activated: true,
            activatedAt: knex.fn.now()
        }
    )
    await saveOrGetUser(users.archer)

    users.lana = new User(
        {
            name: 'Lana Kane',
            email: 'hands@example.gov',
            password: 'password',
            passwordConfirmation: 'password',
            activated: true,
            activatedAt: knex.fn.now()
        }
    )
    await saveOrGetUser(users.lana)

    users.malory = new User(
        {
            name: 'Malory Archer',
            email: 'boss@example.gov',
            password: 'password',
            passwordConfirmation: 'password',
            activated: true,
            activatedAt: knex.fn.now()
        }
    )
    await saveOrGetUser(users.malory)

    for (let i = 0; i < 30; ++i) {
        const prop = `user_${i}`
        users[prop] = new User(
            {
                name: `User ${i}`,
                email: `user-${i}@example.com`,
                password: 'password',
                passwordConfirmation: 'password',
                activated: true,
                activatedAt: knex.fn.now()
            }
        )
        await saveOrGetUser(users[prop])
    }

    return users
}

async function setupMicroposts(user) {
    await knex('microposts').del() // 呼び出すたびに初期化
    const microposts = {}
    let m

    m = await user.microposts.create({ content: 'I just ate an orange!' })
    await m.updateAttribute('createdAt', knex.raw("datetime('now', '-10 minutes')")) // sqlite3用
    microposts.orange = m

    m = await user.microposts.create({ content: 'Check out the @tauday site by @mhartl: https://tauday.com' })
    await m.updateAttribute('createdAt', knex.raw("datetime('now', '-3 years')"))
    microposts.tauManifesto = m

    m = await user.microposts.create({ content: 'Sad cats are sad: https://youtu.be/PKffm2uI4dk' })
    await m.updateAttribute('createdAt', knex.raw("datetime('now', '-2 hours')"))
    microposts.catVideo = m

    m = await user.microposts.create({ content: 'Writing a short test' })
    await m.updateAttribute('createdAt', knex.fn.now())
    microposts.mostRecent = m

    for (let i = 0; i < 30; ++i) {
        const content = faker.lorem.sentence(5)
        m = await user.microposts.create({ content: content })
        await m.updateAttribute('createdAt', knex.raw("datetime('now', '-42 days')"))
        microposts[`micropost_${i}`] = m
    }

    return microposts
}

async function setupRelationships(users) {
    const michael = users.michael
    const archer = users.archer
    const lana = users.lana
    const malory = users.malory
    const relationships = {}

    relationships.one = await Relationships.create({ followerId: michael.id, followedId: lana.id })
    relationships.two = await Relationships.create({ followerId: michael.id, followedId: malory.id })
    relationships.three = await Relationships.create({ followerId: lana.id, followedId: michael.id })
    relationships.four = await Relationships.create({ followerId: archer.id, followedId: michael.id })

    return relationships
}

async function postMicropost(agent, content) {
    const csrfToken = await getCsrfToken(agent)
    return await agent
        .post('/microposts')
        .type('form')
        .send({
            _csrf: csrfToken,
            'micropost[content]': content,
        })
}

async function deleteMicropost(agent, micropost) {
    const csrfToken = await getCsrfToken(agent)
    return await agent
        .post(`/microposts/${micropost.id}/delete`)
        .type('form')
        .send({
            _csrf: csrfToken,
        })

}

async function getCsrfToken(agent) {
    const res = await agent.get('/test/res/locals')
    const locals = res.body
    return locals.csrfToken
}

const REDIRECT = 302

function isRedirectTo(res, url) {
    return (res.status === REDIRECT) && (res.headers.location === url)
}


module.exports = {
    mock,
    isLoggedInMock,
    isLoggedIn,
    logInAs,
    setupUsers,
    setupMicroposts,
    setupRelationships,
    postMicropost,
    deleteMicropost,
    getCsrfToken,
    isRedirectTo,
}
