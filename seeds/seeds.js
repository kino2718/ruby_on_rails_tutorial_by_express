const { faker } = require('@faker-js/faker')
const User = require('../app/models/user')

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('users').del()

  // メインのサンプルユーザーを1人作成する
  await User.create({
    name: 'Example User',
    email: 'example@railstutorial.org',
    password: 'foobar',
    passwordConfirmation: 'foobar'
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
      passwordConfirmation: password
    })
  }
}
