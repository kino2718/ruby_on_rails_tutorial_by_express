const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const testHelper = require('../test_helper')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const User = require('../../app/models/user')

const SUCCESS = 200

describe('users index test', () => {
    let users
    let user

    beforeAll(async () => {
        users = await testHelper.setupUsers()
        user = users.michael
    }, 30 * 1000) // セットアップに時間がかかるのでタイムアウト(デフォルト5秒)を伸ばす

    test('index including pagination', async () => {
        expect(users.michael).toBeDefined()
        expect(Object.keys(users).length).toBe(34)

        const agent = request.agent(app)
        // ログイン
        await testHelper.logInAs(agent, user.email, user.password)


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
        const shownUsers = await User.paginate(30, 0)
        shownUsers.forEach(shownUser => {
            const links = $(`a[href="/users/${shownUser.id}"]`)
            expect(links.length).toBeGreaterThan(0)
            const found = links.toArray().some(a => $(a).text().trim() === shownUser.name)
            expect(found).toBe(true)
        })
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
