const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')

describe('users profile test', () => {
    let user

    beforeAll(async () => {
        const users = await testHelper.setupUsers()
        user = users.michael

        await testHelper.setupMicroposts(users)
    })

    async function getUserPath(agent, user) {
        return await agent.get(`/users/${user.id}`)
    }

    test('profile display', async () => {
        const agent = request.agent(app)

        const res = await getUserPath(agent, user)
        const $ = cheerio.load(res.text)

        expect($('title').text().trim()).toBe(`${user.name} | Ruby on Rails Tutorial Sample App`)
        expect($('h1').text()).toContain(user.name)
        expect($('h1 > img.gravatar').length).toBe(1)
        expect(res.text).toContain(`${await user.microposts.count()}`)
        expect($('ul.pagination').length).toBe(1)

        const ms = await user.microposts.paginate(30, 0)
        for (const m of ms) {
            expect(res.text).toContain(m.content)
        }
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
