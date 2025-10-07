const request = require('supertest')
const app = require('../../app/app')

const SUCCESS = 200

describe('sessions controller test', () => {
    test('should get new', async () => {
        const res = await request(app).get('/login')
        expect(res.status).toBe(SUCCESS)
    })
})
