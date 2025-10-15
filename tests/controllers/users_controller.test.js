const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const User = require('../../app/models/user')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')

const SUCCESS = 200
const REDIRECT = 302

describe('users controller test', () => {
    let user
    let otherUser

    beforeAll(async () => {
        await knex('users').del()

        user = new User(
            {
                name: 'Michael Example',
                email: 'michael@example.com',
                password: 'password',
                passwordConfirmation: 'password',
            })
        await user.save()

        otherUser = new User(
            {
                name: 'Sterling Archer',
                email: 'duchess@example.gov',
                password: 'password',
                passwordConfirmation: 'password',
            })
        await otherUser.save()
    })

    test('should get new', async () => {
        const res = await request(app).get('/signup')
        expect(res.status).toBe(SUCCESS)
    })

    test('should redirect edit when not logged in', async () => {
        const agent = request.agent(app)

        // 編集画面にアクセス
        let res = await agent.get(`/users/${user.id}/edit`)

        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // flashの確認
        const $ = cheerio.load(res.text)
        expect($('.alert').length).toBeGreaterThan(0)

        // log inページの確認
        expect($('form[action="/login"]').length).toBe(1)
    })

    test('should redirect update when not logged in', async () => {
        const agent = request.agent(app)

        // crsf tokenを取るためだけにlogin画面にアクセスする
        let res = await agent.get('/login')
        expect(res.status).toBe(SUCCESS)
        let $ = cheerio.load(res.text)
        const csrfToken = $('input[name="_csrf"]').val()

        // 成功する編集データをpost
        res = await agent
            .post(`/users/${user.id}`)
            .type('form')
            .send({
                _csrf: csrfToken,
                'user[name]': user.name,
                'user[email]': user.email,
                'user[password]': '',
                'user[passwordConfirmation]': ''
            })

        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // flashの確認
        $ = cheerio.load(res.text)
        expect($('.alert').length).toBeGreaterThan(0)

        // log inページの確認
        expect($('form[action="/login"]').length).toBe(1)
    })

    test("should redirect edit when logged in as wrong user", async () => {
        const agent = request.agent(app) // session維持のため必要

        // otherUserとしてログイン
        let res = await testHelper.logInAs(agent, otherUser.email, otherUser.password)
        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // ログイン済みのotherUserがuserの編集画面にアクセス
        res = await agent.get(`/users/${user.id}/edit`)

        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // flashが無いことの確認
        const $ = cheerio.load(res.text)
        expect($('.alert').length).toBe(0)

        // rootページの確認
        expect($('title').text().trim()).toBe('Ruby on Rails Tutorial Sample App')
    })

    test("should redirect edit when logged in as wrong user", async () => {
        const agent = request.agent(app) // session維持のため必要

        // crsf tokenを取るためだけにlogin画面にアクセスする
        let res = await agent.get('/login')
        expect(res.status).toBe(SUCCESS)
        let $ = cheerio.load(res.text)
        const csrfToken = $('input[name="_csrf"]').val()

        // otherUserとしてログイン
        res = await testHelper.logInAs(agent, otherUser.email, otherUser.password)
        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // userの編集データをpost
        res = await agent
            .post(`/users/${user.id}`)
            .type('form')
            .send({
                _csrf: csrfToken,
                'user[name]': user.name,
                'user[email]': user.email,
                'user[password]': '',
                'user[passwordConfirmation]': ''
            })

        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // flashが無いことの確認
        $ = cheerio.load(res.text)
        expect($('.alert').length).toBe(0)

        // rootページの確認
        expect($('title').text().trim()).toBe('Ruby on Rails Tutorial Sample App')
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
