const request = require('supertest')
const app = require('../../app/app')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')
const User = require('../../app/models/user')
const Micropost = require('../../app/models/micropost')

const REDIRECT = 302

describe('microposts controller test', () => {
    let michael
    let archer
    let microposts
    let micropost

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

        microposts = await testHelper.setupMicroposts(michael)
        micropost = microposts.orange

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

        const m = await archer.microposts.create({ content: "Oh, is that what you want? Because that's how you get ants!" })
        await m.updateAttribute('createdAt', knex.raw("datetime('now', '-2 years')"))
        microposts.ants = m
    })

    test('should redirect create when not logged in', async () => {
        const agent = request.agent(app)
        const beforeCount = await Micropost.count()
        const res = await testHelper.postMicropost(agent, 'Lorem ipsum')
        const afterCount = await Micropost.count()
        expect(afterCount).toBe(beforeCount)
        expect(res.status).toBe(REDIRECT)
        expect(res.headers.location).toBe('/login')
    })

    test('should redirect destroy when not logged in', async () => {
        const agent = request.agent(app)
        const beforeCount = await Micropost.count()
        const res = await testHelper.deleteMicropost(agent, micropost)
        const afterCount = await Micropost.count()
        expect(afterCount).toBe(beforeCount)
        expect(res.status).toBe(REDIRECT)
        expect(res.headers.location).toBe('/login')
    })

    test('should redirect destroy for wrong micropost', async () => {
        const agent = request.agent(app)
        await testHelper.logInAs(agent, michael.email, michael.password)
        const beforeCount = await Micropost.count()
        const res = await testHelper.deleteMicropost(agent, microposts.ants)
        const afterCount = await Micropost.count()
        expect(afterCount).toBe(beforeCount)
        expect(res.status).toBe(REDIRECT)
        expect(res.headers.location).toBe('/')
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
