const User = require('../../app/models/user')

describe('user model test', () => {
    let user

    beforeEach(() => {
        user = new User({
            name: 'Example User', email: 'user@example.com',
            password: 'foobar', password_confirmation: 'foobar'
        })
    });

    test('should be valid', () => {
        expect(user.valid()).toBe(true)
    })

    test('name should be present', () => {
        user.name = ''
        expect(user.valid()).toBe(false)
    })

    test('email should be present', () => {
        user.email = '     '
        expect(user.valid()).toBe(false)
    })

    test('name should not be too long', () => {
        user.name = 'a'.repeat(50)
        expect(user.valid()).toBe(true)
        user.name = 'a'.repeat(51)
        expect(user.valid()).toBe(false)
    })

    test('email should not be too long', () => {
        user.email = 'a'.repeat(243) + '@example.com'
        expect(user.valid()).toBe(true)
        user.email = 'a'.repeat(244) + '@example.com'
        expect(user.valid()).toBe(false)
    })

    test('email validation should accept valid addresses', () => {
        const validAddresses = ['user@example.com', 'USER@foo.COM', 'A_US-ER@foo.bar.org', 'first.last@foo.jp', 'alice+bob@baz.cn']
        validAddresses.forEach(validAddress => {
            user.email = validAddress
            try {
                expect(user.valid()).toBe(true)
            } catch (e) {
                console.log(`${validAddress} should be valid`)
                throw e
            }
        })
    })

    test('email validation should reject invalid addresses', () => {
        const invalidAddresses = ['user@example,com', 'user_at_foo.org', 'user.name@example.', 'foo@bar_baz.com', 'foo@bar+baz.com']
        invalidAddresses.forEach(invalidAddress => {
            user.email = invalidAddress
            try {
                expect(user.valid()).toBe(false)
            } catch (e) {
                console.log(`${invalidAddress} should be invalid`)
                throw e
            }
        })
    })

    test('email addresses should be unique', async () => {
        const duplicateUser = user.dup()
        duplicateUser.email = user.email.toUpperCase()
        await user.save()
        expect(await duplicateUser.validAsync()).toBe(false)
    })

    const knex_utils = require('../../app/db/knex_utils')
    const knex = knex_utils.knex

    afterAll(async () => {
        await knex.destroy();   // コネクションを閉じる
    });
})
