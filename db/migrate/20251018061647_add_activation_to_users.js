/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.alterTable('users', (table) => {
        table.string('activation_digest')
        table.boolean('activated').defaultTo(false)
        table.timestamp('activated_at', { useTz: true, precision: 6 })
    })

}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('activated_at')
        table.dropColumn('activated')
        table.dropColumn('activation_digest')
    })
}
