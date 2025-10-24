const User = require('../../app/models/user')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const sessionsHelper = require('../../app/helpers/sessions_helper')
const testHelper = require('../test_helper')

describe('sessions helper test', () => {
    let user
    let mock

    beforeEach(async () => {
        await knex('users').del()

        user = new User(
            {
                name: 'Michael Example',
                email: 'michael@example.com',
                password: 'password',
                passwordConfirmation: 'password',
            })
        await user.save()

        mock = testHelper.mock() // res, reqの代わりに使う
        await sessionsHelper.remember(mock, user)
    })

    test('login without remembering', async () => {
        const currentUser = await sessionsHelper.currentUser(mock)
        expect(currentUser.email).toBe(user.email)
        expect(testHelper.isLoggedInMock(mock)).toBeTruthy()
    })

    test('current user returns null when remember digest is wrong', async () => {
        await user.updateAttribute('remember_digest', User.digest(await User.newToken()))
        const currentUser = await sessionsHelper.currentUser(mock)
        expect(currentUser).toBe(null)
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})