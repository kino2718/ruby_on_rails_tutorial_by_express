const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')

const SUCCESS = 200

describe('users controller test', () => {
    test('should get new', async () => {
        const res = await request(app).get('/signup')
        expect(res.status).toBe(SUCCESS)
    })
})
