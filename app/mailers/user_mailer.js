const { createTransporter } = require('./transporter_factory')
const ejs = require('ejs')
const path = require('path')

const transporter = createTransporter()

async function accountActivation(user, baseUrl) {
    const templateDir = path.join(__dirname, '../views/user_mailer')

    // アカウント有効化リンクのメールを作成する
    const mailAddr = encodeURIComponent(user.email)
    const url = `${baseUrl}/account_activations/${user.activationToken}/edit?email=${mailAddr}`
    const text = await ejs.renderFile(`${templateDir}/account_activation.text.ejs`, { user: user, url: url })
    const html = await ejs.renderFile(`${templateDir}/account_activation.html.ejs`, { user: user, url: url })
    return {
        from: 'user@realdomain.com',
        to: user.email,
        subject: 'Account activation',
        text: text,
        html: html,
    }
}

async function passwordReset(user, baseUrl) {
    const templateDir = path.join(__dirname, '../views/user_mailer')

    // パスワードリセットリンクのメールを作成する
    const mailAddr = encodeURIComponent(user.email)
    const url = `${baseUrl}/password_resets/${user.resetToken}/edit?email=${mailAddr}`
    const text = await ejs.renderFile(`${templateDir}/password_reset.text.ejs`, { url: url })
    const html = await ejs.renderFile(`${templateDir}/password_reset.html.ejs`, { url: url })
    return {
        from: 'user@realdomain.com',
        to: user.email,
        subject: 'Password reset',
        text: text,
        html: html,
    }
}

async function deliverNow(mail) {
    // メールを送信する
    const info = await transporter.sendMail(mail)
    if (info && info.message) console.info('sendMail:\n', info.message.toString())
}

module.exports = {
    accountActivation,
    passwordReset,
    deliverNow,
}
