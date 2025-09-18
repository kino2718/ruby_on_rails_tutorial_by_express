/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('name');
        table.string('email').unique();

        // 精度は DB 依存だが、Knex 側で良い感じに作ってくれる
        table
            .timestamp('created_at', { useTz: true, precision: 6 })
            .notNullable()
            .defaultTo(knex.fn.now());
        table
            .timestamp('updated_at', { useTz: true, precision: 6 })
            .notNullable()
            .defaultTo(knex.fn.now());
    });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('users');
};
