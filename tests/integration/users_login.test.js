const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')

const SUCCESS = 200
const UNPROCESSABLE_ENTITY = 422
const REDIRECT = 302

describe('users login test', () => {
    let user

    beforeAll(async () => {
        const users = await testHelper.setupUsers()
        user = users.michael
    })

    async function accessLoginPath(agent) {
        let res = await agent.get('/login')
        return res
    }

    function isLoginTemplate(res) {
        const $ = cheerio.load(res.text)
        const titleText = $('title').text()
        // タイトルが含まれているか確認
        return titleText.includes('Log in')
    }

    function getNumFlash(res, type) {
        // flashがあることの確認
        let $ = cheerio.load(res.text)
        return $(`.alert.alert-${type}`).length
    }

    test('login path', async () => {
        const agent = request.agent(app)
        let res = await accessLoginPath(agent)
        expect(res.status).toBe(SUCCESS)
        expect(isLoginTemplate(res)).toBe(true)
    })

    test('login with valid email/invalid password', async () => {
        const agent = request.agent(app)
        const csrfToken = await testHelper.getCsrfToken(agent)
        // 無効なlog in
        let res = await agent
            .post('/login')
            .type('form')
            .send({
                _csrf: csrfToken,
                'session[email]': user.email,
                'session[password]': 'invalid'
            })
        // ログインしていないことの確認
        const isLoggedIn = await testHelper.isLoggedIn(agent)
        expect(isLoggedIn).toBe(false)
        // ステータスコード (unprocessable_entity = 422)の確認
        expect(res.status).toBe(UNPROCESSABLE_ENTITY)
        // ログイン画面に戻っていることの確認
        expect(isLoginTemplate(res)).toBe(true)
        // flashがあることの確認
        expect(getNumFlash(res, 'danger')).toBe(1)

        // rootにアクセス
        res = await agent.get('/')
        expect(res.status).toBe(SUCCESS)
        // flashが無いことの確認
        expect(getNumFlash(res, 'danger')).toBe(0)
    })

    async function validLogin(agent, user) {
        const csrfToken = await testHelper.getCsrfToken(agent)
        // 有効なlog in
        const res = await agent
            .post('/login')
            .type('form')
            .send({
                _csrf: csrfToken,
                'session[email]': user.email,
                'session[password]': user.password
            })
        return res
    }

    test('valid login', async () => {
        const agent = request.agent(app)
        const res = await validLogin(agent, user)
        // ログインしていることの確認
        const isLoggedIn = await testHelper.isLoggedIn(agent)
        expect(isLoggedIn).toBe(true)
        // redirect先の確認
        expect(res.status).toBe(REDIRECT)
        expect(res.headers.location).toBe(`/users/${user.id}`)
    })

    function isUsersShowTemplate(res, user) {
        const $ = cheerio.load(res.text)
        const titleText = $('title').text()
        // タイトルにユーザー名が含まれているか確認
        return titleText.includes(user.name)
    }

    function getNumAnchor(res, href) {
        // hrefへのanchorの数を確認
        const $ = cheerio.load(res.text)
        return $(`a[href="${href}"]`).length
    }

    function getNumForm(res, action) {
        // formのactionの数を確認
        const $ = cheerio.load(res.text)
        return $(`form[action="${action}"][method="POST"]`).length
    }

    test('redirect after login', async () => {
        const agent = request.agent(app)
        let res = await validLogin(agent, user)
        // リダイレクト先にアクセス
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)
        expect(isUsersShowTemplate(res, user)).toBe(true)
        expect(getNumAnchor(res, '/login')).toBe(0)
        expect(getNumForm(res, '/logout')).toBe(1)
        // console.log('******** res.text: ', res.text )
        expect(getNumAnchor(res, `/users/${user.id}`)).toBeGreaterThan(0)
    })

    async function logOut(agent) {
        const csrfToken = await testHelper.getCsrfToken(agent)
        const res = await agent
            .post('/logout')
            .type('form')
            .send({
                _csrf: csrfToken,
            })
        return res
    }

    test('successful logout', async () => {
        const agent = request.agent(app)
        await validLogin(agent, user)
        let res = await logOut(agent)
        // ログアウトしていることの確認
        const isLoggedIn = await testHelper.isLoggedIn(agent)
        expect(isLoggedIn).toBe(false)
        // redirect先の確認
        expect(res.status).toBe(REDIRECT)
        expect(res.headers.location).toBe('/')
    })

    test('redirect after logout', async () => {
        const agent = request.agent(app)
        await validLogin(agent, user)
        let res = await logOut(agent)
        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)
        expect(getNumAnchor(res, '/login')).toBe(1)
        expect(getNumForm(res, '/logout')).toBe(0)
        expect(getNumAnchor(res, `/users/${user.id}`)).toBe(0)
    })

    test('should still work after logout in second window', async () => {
        const agent = request.agent(app)
        await validLogin(agent, user)
        await logOut(agent)
        // 別のwindowで再度ログアウトすることを想定
        const res = await logOut(agent)
        // root画面にredirectされることを確認
        expect(res.status).toBe(REDIRECT)
        expect(res.headers.location).toBe('/')
    })

    test('login with remembering', async () => {
        const agent = request.agent(app)
        let res = await testHelper.logInAs(agent, user.email, user.password, '1')

        // Set-Cookie ヘッダの配列を取得
        const cookies = res.headers['set-cookie']
        const rememberToken = cookies.find(c => c.startsWith('rememberToken='))
        // 値の取り出し
        const value = rememberToken.split(';')[0].split('=')[1]
        // 1文字以上を確認
        expect(value.length).toBeGreaterThan(0)
    })


    test('login without remembering', async () => {
        const agent = request.agent(app)
        let res = await testHelper.logInAs(agent, user.email, user.password, '1')

        // Cookieが削除されていることを検証
        res = await testHelper.logInAs(agent, user.email, user.password, '0')
        // Set-Cookie ヘッダの配列を取得
        const cookies = res.headers['set-cookie']
        const rememberToken = cookies.find(c => c.startsWith('rememberToken='))
        // 値の取り出し
        const value = rememberToken.split(';')[0].split('=')[1]
        // 空文字列を確認
        expect(value.length).toBe(0)
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
