const User = require('../../app/models/user')

describe('user model test', () => {
    let user

    beforeEach(() => {
        user = new User({ name: 'Example User', email: 'user@example.com' })
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
})
