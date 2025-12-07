/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('images', (table) => {
        table.increments('id').primary()
        table
            .integer('micropost_id')
            .unsigned()                // SQLiteでは無視されるが明示しておく
            .notNullable()
            .references('id')
            .inTable('microposts')
            .onDelete('CASCADE')       // 親が削除されたら自動削除
            .onUpdate('CASCADE')       // 親が更新されたら自動更新

        table.text('file_name').notNullable()
        table.string('mime_type').notNullable()
        table.integer('size').notNullable()

        table
            .timestamp('created_at', { useTz: true, precision: 6 })
            .notNullable()
            .defaultTo(knex.fn.now())

        // インデックス
        table.index('micropost_id', 'idx_micropost_id')
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('images')
}
