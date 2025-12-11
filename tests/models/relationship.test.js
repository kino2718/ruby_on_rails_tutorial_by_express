const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const User = require('../../app/models/user')
const Relationship = require('../../app/models/relationship')

describe('relationship test', () => {
    let michael
    let archer
    let relationship

    beforeAll(async () => {
        await knex('users').del()

        michael = new User(
            {
                name: 'Michael Example',
                email: 'michael@example.com',
                password: 'password',
                passwordConfirmation: 'password',
                activated: true,
                activatedAt: knex.fn.now()
            })
        await michael.save()

        archer = new User(
            {
                name: 'Sterling Archer',
                email: 'duchess@example.gov',
                password: 'password',
                passwordConfirmation: 'password',
                activated: true,
                activatedAt: knex.fn.now()
            }
        )
        await archer.save()

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
