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
})
