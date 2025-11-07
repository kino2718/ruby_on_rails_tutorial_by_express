const request = require('supertest')
const app = require('../../app/app')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')
const User = require('../../app/models/user')
const Micropost = require('../../app/models/micropost')

const REDIRECT = 302

describe('users profile test', () => {
    let user
    let microposts
    let micropost

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

        microposts = await testHelper.setupMicroposts(user)
        micropost = microposts.orange
    })

    async function postMicropost(agent) {
        const csrfToken = await testHelper.getCsrfToken(agent)
        return await agent
            .post('/microposts')
            .type('form')
            .send({
                _csrf: csrfToken,
                content: 'Lorem ipsum',
            })
    }

    test('should redirect create when not logged in', async () => {
        const agent = request.agent(app)
        const beforeCount = await Micropost.count()
        const res = await postMicropost(agent)
        const afterCount = await Micropost.count()
        expect(afterCount).toBe(beforeCount)
        expect(res.status).toBe(REDIRECT)
        expect(res.headers.location).toBe('/login')
    })

    async function postMicropostDelete(agent, micropost) {
        const csrfToken = await testHelper.getCsrfToken(agent)
        return await agent
            .post(`/microposts/${micropost.id}/delete`)
            .type('form')
            .send({
                _csrf: csrfToken,
            })

    }

    test('should redirect destroy when not logged in', async () => {
        const agent = request.agent(app)
        const beforeCount = await Micropost.count()
        const res = await postMicropostDelete(agent, micropost)
        const afterCount = await Micropost.count()
        expect(afterCount).toBe(beforeCount)
        expect(res.status).toBe(REDIRECT)
        expect(res.headers.location).toBe('/login')
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
