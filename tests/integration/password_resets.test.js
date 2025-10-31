const request = require('supertest')
const cheerio = require('cheerio')
const app = require('../../app/app')
const User = require('../../app/models/user')
const knexUtils = require('../../app/db/knex_utils')
const knex = knexUtils.knex
const transporterFactory = require('../../app/mailers/transporter_factory')
const testHelper = require('../test_helper')

const REDIRECT = 302
const UNPROCESSABLE_ENTITY = 422

describe('password resets test', () => {
  // test用のmock
  const transporter = transporterFactory.createTransporter()

  beforeAll(async () => {
    await knex('users').del()

    const user = new User(
      {
        name: 'Michael Example',
        email: 'michael@example.com',
        password: 'password',
        passwordConfirmation: 'password',
        activated: true,
        activatedAt: knex.fn.now()
      })
    await user.save()
  })

  beforeEach(async () => {
    transporter.clear()
  })

  function isPasswordResetTemplate(res) {
    const $ = cheerio.load(res.text)
    const titleText = $('title').text()
    // タイトルが含まれているか確認
    return titleText.includes('Forgot password')
  }

  test('password reset path', async () => {
    const agent = request.agent(app)
    const res = await agent.get('/password_resets/new')
    expect(isPasswordResetTemplate(res)).toBe(true)
    const $ = cheerio.load(res.text)
    expect($('input[name="password_reset[email]"]').length).toBe(1)
  })

  async function postResetsPath(agent, email) {
    const csrfToken = await testHelper.getCsrfToken(agent)
    return await agent
      .post('/password_resets')
      .type('form')
      .send({
        _csrf: csrfToken,
        'password_reset[email]': email,
      })
  }

  function isFlashEmpty(res) {
    const $ = cheerio.load(res.text)
    return $('div.alert').length == 0
  }

  test('reset path with invalid email', async () => {
    const agent = request.agent(app)
    const res = await postResetsPath(agent, '')
    expect(res.status).toBe(UNPROCESSABLE_ENTITY)
    expect(isFlashEmpty(res)).toBe(false)
  })

  let user
  let resetUser

  async function getUser(email) {
    const users = await User.findBy({ email: email })
    return users?.at(0)
  }

  async function setupPasswordResetFrom(agent) {
    user = await getUser('michael@example.com')
    const res = await postResetsPath(agent, 'michael@example.com')
    resetUser = await getUser('michael@example.com')
    return res
  }

  function isRedirectTo(res, url) {
    return (res.status === REDIRECT) && (res.headers.location === url)
  }

  test('reset with valid email', async () => {
    const agent = request.agent(app)
    let res = await setupPasswordResetFrom(agent)
    expect(user.resetDigest).not.toBe(resetUser.resetDigest)
    // reset mailの件数を確認
    expect(transporterFactory.mockTransporter.count).toBe(1)

    expect(isRedirectTo(res, '/')).toBe(true)
    // リダイレクト先にアクセス
    res = await agent.get(res.headers.location)
    expect(isFlashEmpty(res)).toBe(false)
  })

  async function getEditPasswordResetPath(agent, token, email) {
    return await agent.get(`/password_resets/${token}/edit?email=${email}`)
  }

  function getToken() {
    const mail = transporterFactory.mockTransporter.mail.text
    if (!mail) return ''
    const match = mail.match(/\/password_resets\/([^/]+)\/edit/)
    const token = match?.at(1)
    return token
  }

  test('reset with wrong email', async () => {
    const agent = request.agent(app)
    await setupPasswordResetFrom(agent)
    const token = getToken()
    let res = await getEditPasswordResetPath(agent, token, '')
    expect(isRedirectTo(res, '/')).toBe(true)
  })

  test('reset with inactive user', async () => {
    const agent = request.agent(app)
    await setupPasswordResetFrom(agent)
    const token = getToken()

    // resetUserをinactiveにする
    await resetUser.updateAttribute('activated', false)

    let res = await getEditPasswordResetPath(agent, token, resetUser.email)
    expect(isRedirectTo(res, '/')).toBe(true)

    // resetUserをactiveに戻す
    await resetUser.updateAttribute('activated', true)
  })

  test('reset with right email but wrong token', async () => {
    const agent = request.agent(app)
    await setupPasswordResetFrom(agent)
    let res = await getEditPasswordResetPath(agent, 'wrong token', resetUser.email)
    expect(isRedirectTo(res, '/')).toBe(true)
  })

  function isPasswordResetsEditTemplate(res) {
    const $ = cheerio.load(res.text)
    const titleText = $('title').text()
    // タイトルが含まれているか確認
    return titleText.includes('Reset password')
  }

  test('reset with right email and right token', async () => {
    const agent = request.agent(app)
    await setupPasswordResetFrom(agent)
    const token = getToken()
    const res = await getEditPasswordResetPath(agent, token, resetUser.email)
    expect(isPasswordResetsEditTemplate(res)).toBe(true)
    const $ = cheerio.load(res.text)
    expect($(`input[name="email"][type="hidden"][value="${resetUser.email}"]`).length).toBe(1)
  })

  async function postPasswordResetPath(agent, token, email, password, confirmation) {
    const csrfToken = await testHelper.getCsrfToken(agent)
    return await agent
      .post(`/password_resets/${token}`)
      .type('form')
      .send({
        _csrf: csrfToken,
        email: email,
        'user[password]': password,
        'user[passwordConfirmation]': confirmation,
      })
  }

  test('update with invalid password and confirmation', async () => {
    const agent = request.agent(app)
    await setupPasswordResetFrom(agent)
    const token = getToken()
    const res = await postPasswordResetPath(agent, token, resetUser.email, 'foobaz', 'barquux')
    const $ = cheerio.load(res.text)
    expect($('div#error_explanation').length).toBe(1)
  })

  test('update with empty password', async () => {
    const agent = request.agent(app)
    await setupPasswordResetFrom(agent)
    const token = getToken()
    const res = await postPasswordResetPath(agent, token, resetUser.email, '', '')
    const $ = cheerio.load(res.text)
    expect($('div#error_explanation').length).toBe(1)
  })

  test('update with valid password and confirmation', async () => {
    const agent = request.agent(app)
    await setupPasswordResetFrom(agent)
    const token = getToken()
    let res = await postPasswordResetPath(agent, token, resetUser.email, 'foobaz', 'foobaz')
    expect(res.status).toBe(REDIRECT)
    expect(isRedirectTo(res, `/users/${resetUser.id}`)).toBe(true)
    // リダイレクト先にアクセス
    res = await agent.get(res.headers.location)
    // ログインしていることの確認
    const isLoggedIn = await testHelper.isLoggedIn(agent)
    expect(isLoggedIn).toBe(true)
    expect(isFlashEmpty(res)).toBe(false)
  })

  afterAll(async () => {
    await knex.destroy() // コネクションを閉じる
  })
})
