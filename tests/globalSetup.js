const knexUtils = require('../app/db/knex_utils')
const knex = knexUtils.knex
const testHelper = require('./test_helper')

module.exports = async () => {
    await testHelper.setupUsers()
    await knex.destroy() // コネクションを閉じる
}
