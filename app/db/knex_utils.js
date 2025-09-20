const knexConfig = require('../../knexfile')

const env = process.env.NODE_ENV || 'development'
const knex = require('knex')(knexConfig[env])

function debugLog(log) {
    if (knex.client.config.debug) {
        console.log(log)
    }
}

module.exports = {
    knex,
    debugLog,
}
