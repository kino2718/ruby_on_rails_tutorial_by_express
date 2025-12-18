const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const User = require('../../app/models/user')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('../test_helper')

const SUCCESS = 200
const REDIRECT = 302

describe('users controller test', () => {
    let user
    let otherUser

    beforeAll(async () => {
        const users = await testHelper.setupUsers()
        user = users.michael
        otherUser = users.archer
    })

    test('should get new', async () => {
        const res = await request(app).get('/signup')
        expect(res.status).toBe(SUCCESS)
    })

    test('should redirect index when not logged in', async () => {
        const res = await request(app).get('/users')
        // ステータスコードの確認
        expect(res.status).toBe(REDIRECT)
        // リダイレクト先のURL確認
        expect(res.headers.location).toBe('/login')
    })

    test('should redirect edit when not logged in', async () => {
        const agent = request.agent(app)

        // 編集画面にアクセス
        let res = await agent.get(`/users/${user.id}/edit`)

        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // flashの確認
        const $ = cheerio.load(res.text)
        expect($('.alert').length).toBeGreaterThan(0)

        // log inページの確認
        expect($('form[action="/login"]').length).toBe(1)
    })

    test('should redirect update when not logged in', async () => {
        const agent = request.agent(app)

        // crsf tokenを取るためだけにlogin画面にアクセスする
        let res = await agent.get('/login')
        expect(res.status).toBe(SUCCESS)
        let $ = cheerio.load(res.text)
        const csrfToken = $('input[name="_csrf"]').val()

        // 成功する編集データをpost
        res = await agent
            .post(`/users/${user.id}`)
            .type('form')
            .send({
                _csrf: csrfToken,
                'user[name]': user.name,
                'user[email]': user.email,
                'user[password]': '',
                'user[passwordConfirmation]': ''
            })

        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // flashの確認
        $ = cheerio.load(res.text)
        expect($('.alert').length).toBeGreaterThan(0)

        // log inページの確認
        expect($('form[action="/login"]').length).toBe(1)
    })

    test("should redirect edit when logged in as wrong user", async () => {
        const agent = request.agent(app) // session維持のため必要

        // otherUserとしてログイン
        let res = await testHelper.logInAs(agent, otherUser.email, otherUser.password)
        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // ログイン済みのotherUserがuserの編集画面にアクセス
        res = await agent.get(`/users/${user.id}/edit`)

        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // flashが無いことの確認
        const $ = cheerio.load(res.text)
        expect($('.alert').length).toBe(0)

        // rootページの確認
        expect($('title').text().trim()).toBe('Ruby on Rails Tutorial Sample App')
    })

    test("should redirect edit when logged in as wrong user", async () => {
        const agent = request.agent(app) // session維持のため必要

        // crsf tokenを取るためだけにlogin画面にアクセスする
        let res = await agent.get('/login')
        expect(res.status).toBe(SUCCESS)
        let $ = cheerio.load(res.text)
        const csrfToken = $('input[name="_csrf"]').val()

        // otherUserとしてログイン
        res = await testHelper.logInAs(agent, otherUser.email, otherUser.password)
        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // userの編集データをpost
        res = await agent
            .post(`/users/${user.id}`)
            .type('form')
            .send({
                _csrf: csrfToken,
                'user[name]': user.name,
                'user[email]': user.email,
                'user[password]': '',
                'user[passwordConfirmation]': ''
            })

        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先にアクセスして確認
        res = await agent.get(res.headers.location)
        expect(res.status).toBe(SUCCESS)

        // flashが無いことの確認
        $ = cheerio.load(res.text)
        expect($('.alert').length).toBe(0)

        // rootページの確認
        expect($('title').text().trim()).toBe('Ruby on Rails Tutorial Sample App')
    })

    test('should redirect destroy when not logged in', async () => {
        const agent = request.agent(app)

        const count1 = await User.count()

        // crsf tokenを取るためだけにlogin画面にアクセスする
        let res = await agent.get('/login')
        expect(res.status).toBe(SUCCESS)
        let $ = cheerio.load(res.text)
        const csrfToken = $('input[name="_csrf"]').val()

        // userをdelete
        res = await agent
            .post(`/users/${user.id}/delete`)
            .type('form')
            .send({
                _csrf: csrfToken
            })

        const count2 = await User.count()
        // user数に変化のないことを確認
        expect(count2).toBe(count1)

        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先がloginであることを確認
        expect(res.headers.location).toBe('/login')
    })

    test('should redirect destroy when logged in as a non-admin', async () => {
        const agent = request.agent(app)

        // non-adminとして login
        let res = await testHelper.logInAs(agent, otherUser.email, otherUser.password)

        const count1 = await User.count()

        // crsf tokenを取るためだけにlogin画面にアクセスする
        res = await agent.get('/login')
        expect(res.status).toBe(SUCCESS)
        let $ = cheerio.load(res.text)
        const csrfToken = $('input[name="_csrf"]').val()

        // userをdelete
        res = await agent
            .post(`/users/${user.id}/delete`)
            .type('form')
            .send({
                _csrf: csrfToken
            })

        const count2 = await User.count()
        // user数に変化のないことを確認
        expect(count2).toBe(count1)

        // ステータスコード (REDIRECT = 302)の確認
        expect(res.status).toBe(REDIRECT)

        // リダイレクト先がrootであることを確認
        expect(res.headers.location).toBe('/')
    })

    test('should redirect following when not logged in', async () => {
        const agent = request.agent(app)
        const res = await agent.get(`/users/${user.id}/following`)
        // リダイレクト先が/loginであることを確認
        expect(res.status).toBe(REDIRECT)
        expect(res.headers.location).toBe('/login')
    })

    test('should redirect followers when not logged in', async () => {
        const agent = request.agent(app)
        const res = await agent.get(`/users/${user.id}/followers`)
        // リダイレクト先が/loginであることを確認
        expect(res.status).toBe(REDIRECT)
        expect(res.headers.location).toBe('/login')
    })

    afterAll(async () => {
        await knex.destroy() // コネクションを閉じる
    })
})
/*
  test "should redirect following when not logged in" do
    get following_user_path(@user)
    assert_redirected_to login_url
  end

  test "should redirect followers when not logged in" do
    get followers_user_path(@user)
    assert_redirected_to login_url
  end
*/