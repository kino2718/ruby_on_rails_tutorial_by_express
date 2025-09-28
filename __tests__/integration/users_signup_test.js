const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const User = require('../../app/models/user')

const SUCCESS = 200
const UNPROCESSABLE_ENTITY = 422
const REDIRECT = 302

describe('users signup test', () => {
    test('invalid signup information', async () => {
        const agent = request.agent(app) // sessionを維持するために必要

        // /signupにアクセスしcrfs tokenを取得
        let res = await agent.get('/signup')
        expect(res.status).toBe(SUCCESS)
        let $ = cheerio.load(res.text)
        const csrfToken = $('input[name="_csrf"]').val()

        // 現在のユーザ数を取得
        const beforeCount = await User.count()

        // 失敗するsign upのpost
        res = await agent
            .post('/users')
            .type('form') // application/x-www-form-urlencoded
            .send({
                _csrf: csrfToken,
                'user[name]': '',
                'user[email]': 'user@invalid',
                'user[password]': 'foo',
                'user[password_confirmation]': 'bar'
            })
        // ステータスコード (unprocessable_entity = 422)の確認
        expect(res.status).toBe(UNPROCESSABLE_ENTITY)

        // ユーザ数が増えていないことの確認
        const afterCount = await User.count()
        expect(afterCount).toBe(beforeCount)

        // ページの内容の確認
        $ = cheerio.load(res.text)
        expect($('form[action="/users"]').length).toBe(1)
        expect($('input[name="user[name]"]').length).toBe(1)

    })

    test('valid signup information', async () => {
        const agent = request.agent(app) // sessionを維持するために必要

        // /signupにアクセスしcrfs tokenを取得
        let res = await agent.get('/signup')
        expect(res.status).toBe(SUCCESS)
        let $ = cheerio.load(res.text)
        const csrfToken = $('input[name="_csrf"]').val()

        // 現在のユーザ数を取得
        const beforeCount = await User.count()

        // 成功するsign upのpost
        res = await agent
            .post('/users')
            .type('form') // application/x-www-form-urlencoded
            .send({
                _csrf: csrfToken,
                'user[name]': 'Example User',
                'user[email]': 'user@example.com',
                'user[password]': 'password',
                'user[password_confirmation]': 'password'
            })
            .redirects(1) // redirect先を読み込む
        // ステータスコード (redirect 302)の確認
        expect(res.status).toBe(SUCCESS)

        // ユーザ数が1人増えたことの確認
        const afterCount = await User.count()
        expect(afterCount).toBe(beforeCount + 1)

        // ページの内容の確認
        $ = cheerio.load(res.text)
        expect($('.gravatar').length).toBe(1)

        // 登録したユーザーを削除
        const users = await User.findBy({email: 'user@example.com'})
        if (users[0]) await users[0].destroy()
    })

    const knex_utils = require('../../app/db/knex_utils')
    const knex = knex_utils.knex

    afterAll(async () => {
        await knex.destroy();   // コネクションを閉じる
    })
})
