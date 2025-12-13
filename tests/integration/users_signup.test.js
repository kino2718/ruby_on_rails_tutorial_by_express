const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const User = require('../../app/models/user')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')
const transporterFactory = require('../../app/mailers/transporter_factory')

const UNPROCESSABLE_ENTITY = 422

describe('users signup test', () => {
    // test用のmock
    const transporter = transporterFactory.createTransporter()

    beforeEach(async () => {
        transporter.clear()
    })

    function isUsersNewTemplate(res) {
        const $ = cheerio.load(res.text)
        const haveFormAction = $('form[action="/users"]').length > 0
        return haveFormAction
    }

    test('invalid signup information', async () => {
        const agent = request.agent(app)
        const csrfToken = await testHelper.getCsrfToken(agent)
        // 現在のユーザ数を取得
        const beforeCount = await User.count()

        // 失敗するsign upのpost
        const res = await agent
            .post('/users')
            .type('form') // application/x-www-form-urlencoded
            .send({
                _csrf: csrfToken,
                'user[name]': '',
                'user[email]': 'user@invalid',
                'user[password]': 'foo',
                'user[passwordConfirmation]': 'bar'
            })
        // ステータスコード (unprocessable_entity = 422)の確認
        expect(res.status).toBe(UNPROCESSABLE_ENTITY)

        // ユーザ数が増えていないことの確認
        const afterCount = await User.count()
        expect(afterCount).toBe(beforeCount)

        // ページの内容の確認
        expect(isUsersNewTemplate(res)).toBe(true)
        const $ = cheerio.load(res.text)
        expect($('div#error_explanation').length).toBeGreaterThan(0)
        expect($('div.field_with_errors').length).toBeGreaterThan(0)
    })

    async function validSignup(agent) {
        const csrfToken = await testHelper.getCsrfToken(agent)
        // 成功するsign upのpost
        const res = await agent
            .post('/users')
            .type('form') // application/x-www-form-urlencoded
            .send({
                _csrf: csrfToken,
                'user[name]': 'Example User',
                'user[email]': 'user@example.com',
                'user[password]': 'password',
                'user[passwordConfirmation]': 'password'
            })
        return res
    }

    async function cleanupSignup() {
        const users = await User.findBy({ email: 'user@example.com' })
        const user = users?.at(0)
        await user?.destroy()
    }

    test('valid signup information with account activation', async () => {
        const agent = request.agent(app)
        // 現在のユーザ数を取得
        const beforeCount = await User.count()
        await validSignup(agent)
        // ユーザ数が増えていることの確認
        const afterCount = await User.count()
        expect(afterCount).toBe(beforeCount + 1)
        // validation mailの件数を確認
        const mailCount = transporterFactory.mockTransporter.count
        expect(mailCount).toBe(1)
        await cleanupSignup()
    })

    test('should not be activated', async () => {
        const agent = request.agent(app)
        await validSignup(agent)
        const users = await User.findBy({ email: 'user@example.com' })
        expect(users.length).toBe(1)
        const user = users[0]
        expect(user.activated).toBeFalsy()
        await cleanupSignup()
    })

    test('should not be able to log in before account activation', async () => {
        const agent = request.agent(app)
        await validSignup(agent)
        await testHelper.logInAs(agent, 'user@example.com', 'password')
        expect(await testHelper.isLoggedIn(agent)).toBe(false)
        await cleanupSignup()
    })

    async function activation(agent, token, email) {
        const res = await agent.get(`/account_activations/${token}/edit?email=${email}`)
        return res
    }

    test('should not be able to log in with invalid activation token', async () => {
        const agent = request.agent(app)
        await validSignup(agent)
        await testHelper.logInAs(agent, 'user@example.com', 'password')
        await activation(agent, 'invalid token', 'user@example.com')
        expect(await testHelper.isLoggedIn(agent)).toBe(false)
        await cleanupSignup()
    })

    function getToken() {
        const mail = transporterFactory.mockTransporter.mail.text
        if (!mail) return ''
        const match = mail.match(/\/account_activations\/([^/]+)\/edit/)
        const token = match?.at(1)
        return token
    }

    test('should not be able to log in with invalid email', async () => {
        const agent = request.agent(app)
        await validSignup(agent)
        await testHelper.logInAs(agent, 'user@example.com', 'password')
        const token = getToken()
        await activation(agent, token, 'wrong')
        expect(await testHelper.isLoggedIn(agent)).toBe(false)
        await cleanupSignup()
    })

    test('should log in successfully with valid activation token and email', async () => {
        const agent = request.agent(app)
        await validSignup(agent)
        await testHelper.logInAs(agent, 'user@example.com', 'password')
        const token = getToken()
        await activation(agent, token, 'user@example.com')
        expect(await testHelper.isLoggedIn(agent)).toBe(true)
        await cleanupSignup()
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
