const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')
const Relationship = require('../../app/models/relationship')

const SUCCESS = 200

describe('following test', () => {
    let users
    let user
    let other

    beforeAll(async () => {
        users = await testHelper.setupUsers()
        user = users.michael
        other = users.archer
        await testHelper.setupRelationships(users)
    })

    beforeEach(async () => {
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

    test('should follow a user the standard way', async () => {
        const agent = request.agent(app)
        let res = await testHelper.logInAs(agent, user.email, user.password)
        const beforeCount = await Relationship.count()
        res = await testHelper.postRelationshipsPath(agent, other.id)
        const afterCount = await Relationship.count()
        expect(afterCount).toBe(beforeCount + 1)
        expect(testHelper.isRedirectTo(res, `/users/${other.id}`)).toBe(true)
    })

    test('should unfollow a user the standard way', async () => {
        // 前のテストでuserはotherをfollowしている
        const rels = await user.activeRelationships.findBy({ followedId: other.id })
        const relationship = rels[0]
        const agent = request.agent(app)
        let res = await testHelper.logInAs(agent, user.email, user.password)
        const beforeCount = await Relationship.count()
        res = await testHelper.deleteRelationshipsPath(agent, relationship)
        const afterCount = await Relationship.count()
        expect(afterCount).toBe(beforeCount - 1)
        expect(testHelper.isRedirectTo(res, `/users/${other.id}`)).toBe(true)
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
