const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')

const SUCCESS = 200
const UNPROCESSABLE_ENTITY = 422

describe('users login test', () => {
    test('login with invalid information', async () => {
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
                'session[email]': '',
                'session[password]': ''
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

    const knexUtils = require('../../app/db/knex_utils')
    const knex = knexUtils.knex

    afterAll(async () => {
        // 明示的にはデータベースにアクセスしていないが/loginにpostするとその先でデータベースにアクセスしている
        // のでコネクションを閉じないとテストが終わらなくなる
        await knex.destroy() // コネクションを閉じる
    })
})
