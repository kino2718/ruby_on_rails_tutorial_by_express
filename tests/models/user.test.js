const User = require('../../app/models/user')
const Micropost = require('../../app/models/micropost')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')

describe('user model test', () => {
    let user

    beforeEach(() => {
        user = new User({
            name: 'Example User', email: 'user@example.com',
            password: 'foobar', passwordConfirmation: 'foobar'
        })
    })

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
        user.password = user.passwordConfirmation = ' '.repeat(6)
        expect(await user.valid()).toBe(false)
    })

    test('password should have a minimum length', async () => {
        user.password = user.passwordConfirmation = 'a'.repeat(5)
        expect(await user.valid()).toBe(false)
        user.password = user.passwordConfirmation = 'a'.repeat(6)
        expect(await user.valid()).toBe(true)
    })

    test('user.isAuthenticated should return false for a user with nil digest', () => {
        expect(user.isAuthenticated('remember', '')).toBe(false)
    })

    test('associated microposts should be destroyed', async () => {
        await user.save()
        await user.microposts.create({ content: 'Lorem ipsum' })
        const beforeCount = await Micropost.count()
        await user.destroy()
        const afterCount = await Micropost.count()
        expect(afterCount).toBe(beforeCount - 1)
    })

    test('should follow and unfollow a user', async () => {
        const users = await testHelper.setupUsers()
        const michael = users.michael
        const archer = users.archer

        expect(await michael.isFollowing(archer)).toBe(false)
        await michael.follow(archer)
        expect(await michael.isFollowing(archer)).toBe(true)
        expect(await archer.followers.include(michael)).toBe(true)
        await michael.unfollow(archer)
        expect(await michael.isFollowing(archer)).toBe(false)
        // ユーザーは自分自身をフォローできない
        await michael.follow(michael)
        expect(await michael.isFollowing(michael)).toBe(false)
    })

    test('feed should have the right posts', async () => {
        const users = await testHelper.setupUsers()
        await testHelper.setupMicroposts(users)
        await testHelper.setupRelationships(users)
        const michael = users.michael
        const archer = users.archer
        const lana = users.lana
        // フォローしているユーザーの投稿を確認
        for (const postFollowing of await lana.microposts()) {
            const feed = await michael.feed(Number.MAX_SAFE_INTEGER, 0)
            expect(feed.some(post => post.id === postFollowing.id)).toBe(true)
        }
        // フォロワーがいるユーザー自身の投稿を確認
        for (const postSelf of await michael.microposts()) {
            const feed = await michael.feed(Number.MAX_SAFE_INTEGER, 0)
            expect(feed.some(post => post.id === postSelf.id)).toBe(true)
        }
        // フォローしていないユーザーの投稿を確認
        for (const postUnfollowed of await archer.microposts()) {
            const feed = await michael.feed(Number.MAX_SAFE_INTEGER, 0)
            expect(feed.some(post => post.id === postUnfollowed.id)).toBe(false)
        }
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
