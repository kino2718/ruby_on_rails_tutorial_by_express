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

    test('create should require logged-in user', async () => {
        const agent = request.agent(app)
        const beforeCount = await Relationship.count()
        const res = await testHelper.postRelationshipsPath(agent)
        const afterCount = await Relationship.count()
        expect(afterCount).toBe(beforeCount)
        expect(testHelper.isRedirectTo(res, '/login')).toBe(true)
    })

    test('destroy should require logged-in user', async () => {
        const agent = request.agent(app)
        const beforeCount = await Relationship.count()
        const res = await testHelper.deleteRelationshipsPath(agent, relationships.one)
        const afterCount = await Relationship.count()
        expect(afterCount).toBe(beforeCount)
        expect(testHelper.isRedirectTo(res, '/login')).toBe(true)
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
