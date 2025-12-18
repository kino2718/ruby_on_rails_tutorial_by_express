const request = require('supertest')
const app = require('../../app/app')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')
const Relationship = require('../../app/models/relationship')

describe('relationships controller test', () => {
    let relationships

    beforeAll(async () => {
        const users = await testHelper.setupUsers()
        relationships = await testHelper.setupRelationships(users)
    })

    async function postRelationshipsPath(agent, followedId = null) {
        const csrfToken = await testHelper.getCsrfToken(agent)
        return await agent
            .post('/relationships')
            .type('form')
            .send({
                csrf: csrfToken,
                followed_id: followedId?.id,
            })
    }

    test('create should require logged-in user', async () => {
        const agent = request.agent(app)
        const beforeCount = await Relationship.count()
        const res = await postRelationshipsPath(agent)
        const afterCount = await Relationship.count()
        expect(afterCount).toBe(beforeCount)
        expect(testHelper.isRedirectTo(res, '/login')).toBe(true)
    })

    async function destroyRelationshipsPath(agent, rel) {
        const csrfToken = await testHelper.getCsrfToken(agent)
        return await agent
            .post(`/relationships/`)
            .type('form')
            .send({
                csrf: csrfToken,
                id: rel?.id,
            })
    }

    test('destroy should require logged-in user', async () => {
        const agent = request.agent(app)
        const beforeCount = await Relationship.count()
        const res = await destroyRelationshipsPath(agent, relationships.one)
        const afterCount = await Relationship.count()
        expect(afterCount).toBe(beforeCount)
        expect(testHelper.isRedirectTo(res, '/login')).toBe(true)
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
