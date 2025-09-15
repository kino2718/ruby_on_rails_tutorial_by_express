const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app')

const SUCCESS = 200

describe('static pages controller test', () => {
    test('should get home', async () => {
        const res = await request(app).get('/static_pages/home')
        expect(res.status).toBe(SUCCESS)
        const $ = cheerio.load(res.text)
        expect($('title').text().trim()).toBe('Ruby on Rails Tutorial Sample App')
    })

    test('should get help', async () => {
        const res = await request(app).get('/static_pages/help')
        expect(res.status).toBe(SUCCESS)
        const $ = cheerio.load(res.text)
        expect($('title').text().trim()).toBe('Help | Ruby on Rails Tutorial Sample App')
    })

    test('should get about', async () => {
        const res = await request(app).get('/static_pages/about')
        expect(res.status).toBe(SUCCESS)
        const $ = cheerio.load(res.text)
        expect($('title').text().trim()).toBe('About | Ruby on Rails Tutorial Sample App')
    })

    test('should get contact', async () => {
        const res = await request(app).get('/static_pages/contact')
        expect(res.status).toBe(SUCCESS)
        const $ = cheerio.load(res.text)
        expect($('title').text().trim()).toBe('Contact | Ruby on Rails Tutorial Sample App')
    })
})
