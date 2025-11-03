const User = require('../../app/models/user')
const Micropost = require('../../app/models/micropost')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')

describe('micropost test', () => {
    let user
    let micropost
    let microposts

    beforeAll(async () => {
        await knex('users').del()

        user = new User(
            {
                name: 'Michael Example',
                email: 'michael@example.com',
                password: 'password',
                passwordConfirmation: 'password',
                activated: true,
                activatedAt: knex.fn.now()
            })
        await user.save()

        micropost = user.microposts.build({ content: 'Lorem ipsum' })

        microposts = await testHelper.setupMicroposts(user)
        console.log('******** microposts: ', microposts)
    })

    test('should be valid', () => {
        expect(micropost.valid()).toBe(true)
    })

    test('user id should be present', () => {
        const userId = micropost.userId
        micropost.userId = null
        expect(micropost.valid()).toBe(false)
        micropost.userId = userId
    })

    test('content should be present', () => {
        const content = micropost.content
        micropost.content = '   '
        expect(micropost.valid()).toBe(false)
        micropost.content = content
    })

    test('content should be at most 140 characters', () => {
        const content = micropost.content
        micropost.content = 'a'.repeat(141)
        expect(micropost.valid()).toBe(false)
        micropost.content = content
    })

    test('order should be most recent first', async () => {
        const mostRecent = microposts.mostRecent
        const first = await Micropost.first()
        expect(first.id).toBe(mostRecent.id)
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
