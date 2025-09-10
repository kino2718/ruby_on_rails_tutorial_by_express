const request = require('supertest')
const app = require('../../app')

const SUCCESS = 200

describe('static pages controller test', () => {
    test('should get home', async () => {
        const res = await request(app).get('/static_pages/home')
        expect(res.status).toBe(SUCCESS)
    })

    test('should get help', async () => {
        const res = await request(app).get('/static_pages/help')
        expect(res.status).toBe(SUCCESS)
    })

    test('should get about', async () => {
        const res = await request(app).get('/static_pages/about')
        expect(res.status).toBe(SUCCESS)
    })
})
