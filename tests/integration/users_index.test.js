const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const testHelper = require('../test_helper')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const User = require('../../app/models/user')

const SUCCESS = 200
const REDIRECT = 302

describe('users index test', () => {
    let users
    let admin
    let nonAdmin
    let nonAdmin2

    beforeAll(async () => {
        users = await testHelper.setupUsers()
        admin = users.michael
        nonAdmin = users.archer
        nonAdmin2 = users.lana
    }, 30 * 1000) // セットアップに時間がかかるのでタイムアウト(デフォルト5秒)を伸ばす

    test('index as admin including pagination and delete links', async () => {
        const agent = request.agent(app)
        // ログイン
        await testHelper.logInAs(agent, admin.email, admin.password)

        // ユーザリスト画面にアクセス
        let res = await agent.get(`/users`)
        // アクセス成功
        expect(res.status).toBe(SUCCESS)

        // ページの内容の確認
        let $ = cheerio.load(res.text)
        expect($('title').text().trim()).toBe('All users | Ruby on Rails Tutorial Sample App')
        // pagenationの確認
        expect($('ul.pagination').length).toBeGreaterThan(0)
        // 表示されているユーザーの確認
        const firstPageOfUsers = await User.paginate(30, 0)
        firstPageOfUsers.forEach(shownUser => {
            const links = $(`a[href="/users/${shownUser.id}"]`)
            expect(links.length).toBeGreaterThan(0)
            const found = links.toArray().some(a => $(a).text().trim() === shownUser.name)
            expect(found).toBe(true)

            // delete formの確認
            if (shownUser.id !== admin.id) {
                const form = $(`form[action="/users/${shownUser.id}/delete"]`)
                expect(form.length).toBeGreaterThan(0)
            }
        })

        const csrfToken = $('input[name="_csrf"]').val()

        // ユーザ数
        const count1 = await User.count()

        // userをdelete
        res = await agent
            .post(`/users/${nonAdmin.id}/delete`)
            .type('form')
            .send({
                _csrf: csrfToken
            })

        const count2 = await User.count()
        // user数が一人減ったことを確認
        expect(count2).toBe(count1 - 1)

        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先がusersであることを確認
        expect(res.headers.location).toBe('/users')
    })

    test('index as non-admin', async () => {
        const agent = request.agent(app)
        // ログイン
        await testHelper.logInAs(agent, nonAdmin2.email, nonAdmin2.password)

        // ユーザリスト画面にアクセス
        let res = await agent.get(`/users`)
        // アクセス成功
        expect(res.status).toBe(SUCCESS)

        // ページの内容の確認
        let $ = cheerio.load(res.text)
        const form = $('form[action*="/delete"]')
        expect(form.length).toBe(0)
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
