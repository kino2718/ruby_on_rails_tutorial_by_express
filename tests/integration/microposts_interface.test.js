const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')
const Micropost = require('../../app/models/micropost')

const REDIRECT = 302

describe('microposts interface test', () => {
    let michael
    let archer
    let microposts

    beforeAll(async () => {
        const users = await testHelper.setupUsers()
        michael = users.michael
        microposts = await testHelper.setupMicroposts(michael)
        archer = users.archer
        const m = await archer.microposts.create({ content: "Oh, is that what you want? Because that's how you get ants!" })
        await m.updateAttribute('createdAt', knex.raw("datetime('now', '-2 years')"))
        microposts.ants = m
    })

    test('should paginate microposts', async () => {
        const agent = request.agent(app)
        await testHelper.logInAs(agent, michael.email, michael.password)
        const res = await agent.get('/')
        // pagenationの確認
        let $ = cheerio.load(res.text)
        expect($('ul.pagination').length).toBeGreaterThan(0)
    })

    test('should show errors but not create micropost on invalid submission', async () => {
        const agent = request.agent(app)
        await testHelper.logInAs(agent, michael.email, michael.password)
        const beforeCount = await Micropost.count()
        const res = await testHelper.postMicropost(agent, '')
        const afterCount = await Micropost.count()
        expect(afterCount).toBe(beforeCount)
        const $ = cheerio.load(res.text)
        expect($('div#error_explanation').length).toBeGreaterThan(0)
        expect($('a[href="/?page=2"]').length).toBeGreaterThan(0)
    })

    test('should create a micropost on valid submission', async () => {
        const agent = request.agent(app)
        await testHelper.logInAs(agent, michael.email, michael.password)
        const beforeCount = await Micropost.count()
        const content = 'This micropost really ties the room together'
        let res = await testHelper.postMicropost(agent, content)
        const afterCount = await Micropost.count()
        expect(afterCount).toBe(beforeCount + 1)
        expect(res.status).toBe(REDIRECT)
        expect(res.headers.location).toBe('/')
        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.text).toContain(content)
    })

    test('should have micropost delete forms on own profile page', async () => {
        const agent = request.agent(app)
        await testHelper.logInAs(agent, michael.email, michael.password)
        const res = await agent.get(`/users/${michael.id}`)
        const $ = cheerio.load(res.text)
        expect($('button[type="submit"]').text()).toContain('delete')
    })

    test('should be able to delete own micropost', async () => {
        const agent = request.agent(app)
        await testHelper.logInAs(agent, michael.email, michael.password)
        const beforeCount = await Micropost.count()
        const firstMicropost = (await michael.microposts.paginate(30, 0)).at(0)
        await testHelper.deleteMicropost(agent, firstMicropost)
        const afterCount = await Micropost.count()
        expect(afterCount).toBe(beforeCount - 1)
    })

    test("should not have delete links on other user's profile page", async () => {
        const agent = request.agent(app)
        await testHelper.logInAs(agent, michael.email, michael.password)
        const res = await agent.get(`/users/${archer.id}`)
        const $ = cheerio.load(res.text)
        expect($('button[type="submit"]').text()).not.toContain('delete')
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
