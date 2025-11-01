/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('microposts', (table) => {
        table.increments('id').primary()
        table.text('content')
        table
            .integer('user_id')
            .unsigned()                // SQLiteでは無視されるが明示しておく
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE')       // 親が削除されたら自動削除
            .onUpdate('CASCADE')       // 親が更新されたら自動更新

        table
            .timestamp('created_at', { useTz: true, precision: 6 })
            .notNullable()
            .defaultTo(knex.fn.now())
        table
            .timestamp('updated_at', { useTz: true, precision: 6 })
            .notNullable()
            .defaultTo(knex.fn.now())

        // インデックス
        table.index('user_id', 'idx_user_id')
        table.index(['user_id', 'created_at'], 'idx_user_id_created_at')
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('microposts')
}
