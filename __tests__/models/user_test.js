const User = require('../../app/models/user')

describe('user model test', () => {
    let user

    beforeEach(() => {
        user = new User({
            name: 'Example User', email: 'user@example.com',
            password: 'foobar', password_confirmation: 'foobar'
        })
    });

    test('should be valid', async () => {
        expect(await user.valid()).toBe(true)
    })

    test('name should be present', async () => {
        user.name = ''
        expect(await user.valid()).toBe(false)
    })

    test('email should be present', async () => {
        user.email = '     '
        expect(await user.valid()).toBe(false)
    })

    test('name should not be too long', async () => {
        user.name = 'a'.repeat(50)
        expect(await user.valid()).toBe(true)
        user.name = 'a'.repeat(51)
        expect(await user.valid()).toBe(false)
    })

    test('email should not be too long', async () => {
        user.email = 'a'.repeat(243) + '@example.com'
        expect(await user.valid()).toBe(true)
        user.email = 'a'.repeat(244) + '@example.com'
        expect(await user.valid()).toBe(false)
    })

    test('email validation should accept valid addresses', async () => {
        const validAddresses = ['user@example.com', 'USER@foo.COM', 'A_US-ER@foo.bar.org', 'first.last@foo.jp', 'alice+bob@baz.cn']
        for (const validAddress of validAddresses) {
            user.email = validAddress
            try {
                expect(await user.valid()).toBe(true)
            } catch (e) {
                console.log(`${validAddress} should be valid`)
                throw e
            }
        }
    })

    test('email validation should reject invalid addresses', async () => {
        const invalidAddresses = ['user@example,com', 'user_at_foo.org', 'user.name@example.', 'foo@bar_baz.com', 'foo@bar+baz.com']
        for (const invalidAddress of invalidAddresses) {
            user.email = invalidAddress
            try {
                expect(await user.valid()).toBe(false)
            } catch (e) {
                console.log(`${invalidAddress} should be invalid`)
                throw e
            }
        }
    })

    test('email addresses should be unique', async () => {
        const duplicateUser = user.dup()
        duplicateUser.email = user.email.toUpperCase()
        await user.save()
        expect(await duplicateUser.valid()).toBe(false)
        await user.destroy() // データベースからuserを削除
    })

    test('password should be present (nonblank)', async () => {
        user.password = user.password_confirmation = ' '.repeat(6)
        expect(await user.valid()).toBe(false)
    })

    test('password should have a minimum length', async () => {
        user.password = user.password_confirmation = 'a'.repeat(5)
        expect(await user.valid()).toBe(false)
        user.password = user.password_confirmation = 'a'.repeat(6)
        expect(await user.valid()).toBe(true)
    })

    const knex_utils = require('../../app/db/knex_utils')
    const knex = knex_utils.knex

    afterAll(async () => {
        await knex.destroy();   // コネクションを閉じる
    });
})
