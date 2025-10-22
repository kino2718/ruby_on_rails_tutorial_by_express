const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const User = require('../../app/models/user')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')

const SUCCESS = 200
const UNPROCESSABLE_ENTITY = 422
const REDIRECT = 302

describe('users login test', () => {
    let user

    beforeAll(async () => {
        await knex('users').del()

        user = new User(
            {
                name: 'Michael Example',
                email: 'michael@example.com',
                password: 'password',
                passwordConfirmation: 'password',
                activated: true,
                activatedAt: knex.fn.now()
            })
        await user.save()
    })

    test('login with valid email/invalid password', async () => {
        const agent = request.agent(app) // session維持のため必要

        // loginにアクセスしてcrfs tokenを取得
        let res = await agent.get('/login')
        expect(res.status).toBe(SUCCESS)
        let $ = cheerio.load(res.text)
        const csrfToken = $('input[name="_csrf"]').val()

        // 無効なlog in
        res = await agent
            .post('/login')
            .type('form')
            .send({
                _csrf: csrfToken,
                'session[email]': user.email,
                'session[password]': 'invalid'
            })
        // ステータスコード (unprocessable_entity = 422)の確認
        expect(res.status).toBe(UNPROCESSABLE_ENTITY)

        // log in画面が表示されていることの確認
        $ = cheerio.load(res.text)
        expect($('form[action="/login"]').length).toBe(1)
        expect($('input[name="session[email]"]').length).toBe(1)

        // flashがあることの確認
        // 要素が存在するか確認
        expect($('.alert.alert-danger').length).toBe(1)
        // テキストが期待通りか確認
        // expect($('.alert.alert-danger').text()).toContain('Invalid email/password combination')

        // rootにアクセス
        res = await agent.get('/login')
        expect(res.status).toBe(SUCCESS)
        // flashが無いことの確認
        // 要素が存在するか確認
        $ = cheerio.load(res.text)
        expect($('.alert.alert-danger').length).toBe(0)
    })

    test('login with valid information followed by logout', async () => {
        const agent = request.agent(app) // session維持のため必要

        // loginにアクセスしてcrfs tokenを取得
        let res = await agent.get('/login')
        expect(res.status).toBe(SUCCESS)
        let $ = cheerio.load(res.text)
        let csrfToken = $('input[name="_csrf"]').val()

        // 有効なlog in
        res = await agent
            .post('/login')
            .type('form')
            .send({
                _csrf: csrfToken,
                'session[email]': user.email,
                'session[password]': user.password
            })

        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // ユーザーのページを表示していることを確認
        $ = cheerio.load(res.text)
        expect($('.gravatar').length).toBe(1)

        // <a href="/login">Log in</a> が存在しないことを確認
        expect($('a[href="/login"]').length).toBe(0)

        // <form action="/logout" method="POST"> が存在することを確認
        let form = $('form[action="/logout"][method="POST"]')
        expect(form.length).toBe(1)

        // <a href="/users/?">Profile</a> が存在することを確認
        expect($(`a[href="/users/${user.id}"]`).length).toBe(1)

        // ログアウト
        // csrf tokenを取得
        csrfToken = $('input[name="_csrf"]').val()
        res = await agent
            .post('/logout')
            .type('form')
            .send({
                _csrf: csrfToken,
            })

        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // root ページを表示していることを確認
        $ = cheerio.load(res.text)
        expect($('title').text().trim()).toBe('Ruby on Rails Tutorial Sample App')

        // 2番目のウィンドウでログアウトをクリックするユーザーをシミュレートする
        res = await agent
            .post('/logout')
            .type('form')
            .send({
                _csrf: csrfToken,
            })
        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // <a href="/login">Log in</a> が存在することを確認
        expect($('a[href="/login"]').length).toBe(1)

        // <form action="/logout" method="POST"> が存在しないことを確認
        form = $('form[action="/logout"][method="POST"]')
        expect(form.length).toBe(0)

        // <a href="/users/?">Profile</a> が存在しないことを確認
        expect($(`a[href="/users/${user.id}"]`).length).toBe(0)
    })

    test('login with remembering', async () => {
        const agent = request.agent(app) // session維持のため必要
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
        const agent = request.agent(app) // session維持のため必要
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
