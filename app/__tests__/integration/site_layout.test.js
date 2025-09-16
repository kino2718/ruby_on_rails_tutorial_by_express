const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app')

const SUCCESS = 200

describe('site layout test', () => {
    test('layout links', async () => {
        const res = await request(app).get('/')
        expect(res.status).toBe(SUCCESS)

        const $ = cheerio.load(res.text)

        // ルートへのリンクが2つ
        expect($('a[href="/"]').length).toBe(2)

        // 各リンクが存在する
        expect($('a[href="/help"]').length).toBeGreaterThan(0)
        expect($('a[href="/about"]').length).toBeGreaterThan(0)
        expect($('a[href="/contact"]').length).toBeGreaterThan(0)
    })
})
