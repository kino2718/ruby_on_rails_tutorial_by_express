const User = require('../../app/models/user')
const userMailer = require('../../app/mailers/user_mailer')

describe('user mailer test', () => {
    let user

    beforeAll(async () => {
        user = new User({
            name: 'Michael Example',
            email: 'michael@example.com',
        })
        user.activationToken = await User.newToken()
    })

    test('account activation', async () => {
        const mail = await userMailer.accountActivation(user, 'localhost:3000')
        expect(mail.subject).toBe('Account activation')
        expect(mail.to).toBe(user.email)
        expect(mail.from).toBe('user@realdomain.com')
        expect(mail.text).toContain(user.name)
        expect(mail.html).toContain(user.name)
        expect(mail.text).toContain(user.activationToken)
        expect(mail.html).toContain(user.activationToken)
        expect(mail.text).toContain(encodeURIComponent(user.email))
        expect(mail.html).toContain(encodeURIComponent(user.email))
    })
})
