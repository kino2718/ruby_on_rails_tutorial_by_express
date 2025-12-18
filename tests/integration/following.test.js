const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')

const SUCCESS = 200

describe('following test', () => {
    let user

    beforeAll(async () => {
        const users = await testHelper.setupUsers()
        user = users.michael
        await testHelper.setupRelationships(users)
    })

    test('following page', async () => {
        const agent = request.agent(app)
        let res = await testHelper.logInAs(agent, user.email, user.password)
        res = await agent.get(`/users/${user.id}/following`)
        expect(res.status).toBe(SUCCESS)
        const following = await user.following()
        expect(following.length).toBeGreaterThan(0)
        const count = await user.following.count()
        expect(res.text).toContain(String(count))
        const $ = cheerio.load(res.text)
        for (const user of following) {
            const userPath = `/users/${user.id}`
            const links = $(`a[href="${userPath}"]`)
            expect(links.length).toBeGreaterThan(0)
        }
    })

    test('followers page', async () => {
        const agent = request.agent(app)
        let res = await testHelper.logInAs(agent, user.email, user.password)
        res = await agent.get(`/users/${user.id}/followers`)
        expect(res.status).toBe(SUCCESS)
        const followers = await user.followers()
        expect(followers.length).toBeGreaterThan(0)
        const count = await user.followers.count()
        expect(res.text).toContain(String(count))
        const $ = cheerio.load(res.text)
        for (const user of followers) {
            const userPath = `/users/${user.id}`
            const links = $(`a[href="${userPath}"]`)
            expect(links.length).toBeGreaterThan(0)
        }
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
