const nodemailer = require('nodemailer')

function createTransporter() {
    const driver = process.env.MAIL_DRIVER || 'stream'

    if (driver === 'stream') {
        // 開発環境などでAppサーバーログに出力
        return nodemailer.createTransport({
            streamTransport: true,
            buffer: true
        })
    } else if (driver === 'smtp') {
        // 本番など通常のSMTP
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: String(process.env.SMTP_SECURE) === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
    }

    throw new Error(`Unsupported MAIL_DRIVER: ${driver}`)
}

module.exports = {
    createTransporter,
}
