const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const User = require('../../app/models/user')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex

const SUCCESS = 200
const UNPROCESSABLE_ENTITY = 422

describe('users edit test', () => {
    let user

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
    })

    test('unsuccessful edit', async () => {
        const agent = request.agent(app)

        // 編集画面にアクセス
        let res = await agent.get(`/users/${user.id}/edit`)
        // アクセス成功
        expect(res.status).toBe(SUCCESS)
        // ページの内容の確認
        let $ = cheerio.load(res.text)
        expect($(`form[action="/users/${user.id}"]`).length).toBe(1)
        // crsf tokenを取得
        $ = cheerio.load(res.text)
        const csrfToken = $('input[name="_csrf"]').val()

        // 失敗する編集データをpost
        res = await agent
            .post(`/users/${user.id}`)
            .type('form')
            .send({
                _csrf: csrfToken,
                'user[name]': '',
                'user[email]': 'foo@invalid',
                'user[password]': 'foo',
                'user[passwordConfirmation]': 'bar'
            })
        // ステータスコード (unprocessable_entity = 422)の確認
        expect(res.status).toBe(UNPROCESSABLE_ENTITY)
        // ページの内容の確認
        $ = cheerio.load(res.text)
        expect($(`form[action="/users/${user.id}"]`).length).toBe(1)
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
