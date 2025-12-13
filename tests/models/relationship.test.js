const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const Relationship = require('../../app/models/relationship')
const testHelper = require('../test_helper')

describe('relationship test', () => {
    let michael
    let archer
    let relationship

    beforeEach(async () => {
        const users = await testHelper.setupUsers()
        michael = users.michael
        archer = users.archer
        relationship = new Relationship({ followerId: michael.id, followedId: archer.id })
    })

    test('should be valid', () => {
        expect(relationship.valid()).toBe(true)
    })

    test('should require a followerId', () => {
        relationship.followerId = null
        expect(relationship.valid()).toBe(false)
    })

    test('should require a followedId', () => {
        relationship.followedId = null
        expect(relationship.valid()).toBe(false)
    })
    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })

})
