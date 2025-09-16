const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app')

const SUCCESS = 200

describe('users controller test', () => {
    test('should get new', async () => {
        const res = await request(app).get('/users/new')
        expect(res.status).toBe(SUCCESS)
    })
})
