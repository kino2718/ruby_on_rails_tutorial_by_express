exports.up = async function (knex) {
    await knex.schema.createTable('relationships', (table) => {
        table.increments('id').primary()
        table
            .integer('follower_id')
            .unsigned()                // SQLiteでは無視されるが明示しておく
            .notNullable()
            .references('id')
            .inTable('users')
            .onDelete('CASCADE')       // 親が削除されたら自動削除
            .onUpdate('CASCADE')       // 親が更新されたら自動更新
        table
            .integer('followed_id')
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
        table.index('follower_id', 'idx_follower_id')
        table.index('followed_id', 'idx_followed_id')
        table.index(['follower_id', 'followed_id'], 'idx_follower_id_followed_id')
    })
}

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('relationships')
}
