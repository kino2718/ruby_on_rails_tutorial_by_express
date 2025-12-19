const { faker } = require('@faker-js/faker')
const User = require('../app/models/user')

function mySleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
    // メインのサンプルユーザーを1人作成する
    await User.create({
        name: 'Example User',
        email: 'example@railstutorial.org',
        password: 'foobar',
        passwordConfirmation: 'foobar',
        admin: true,
        activated: true,
        activatedAt: knex.fn.now()
    })

    // 追加のユーザーをまとめて生成する
    for (let i = 1; i < 100; ++i) {
        const name = faker.person.fullName()
        const email = `example-${i}@railstutorial.org`
        const password = 'password'
        await User.create({
            name: name,
            email: email,
            password: password,
            passwordConfirmation: password,
            activated: true,
            activatedAt: knex.fn.now()
        })
    }

    // idの順で6人にmicropostsを生成する
    let users = await User.take(6)
    for (let i = 0; i < 50; ++i) {
        const content = faker.lorem.sentence(5)
        for (const user of users) {
            await user.microposts.create({ content: content })
            await mySleep(100) // 連続してデータを作成すると時刻が一緒になってしまうので適当にsleepする
        }
        await mySleep(1000)
    }

    // ユーザーフォローのリレーションシップを作成する
    users = await User.all()
    const user = users[0]
    const following = users.slice(2, 51)
    const followers = users.slice(3, 41)
    for (const followed of following) {
        await user.follow(followed)
    }
    for (const follower of followers) {
        await follower.follow(user)
    }
}
