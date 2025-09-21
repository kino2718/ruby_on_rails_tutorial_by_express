const shared = {
  migrations: {
    tableName: 'knex_migrations',
    directory: './db/migrate', // Ruby on Rails Tutorialに合わせる。
  },
};

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: process.env.SQLITE_FILENAME || './db/development.sqlite3', // Ruby on Rails Tutorialに合わせる。
    },
    useNullAsDefault: true, // SQLite の警告回避
    pool: {
      afterCreate: (conn, cb) => {
        // 外部キーを有効化
        conn.run('PRAGMA foreign_keys = ON', cb);
      },
    },
    debug: true,
    ...shared,
  },

  test: {
    client: 'sqlite3',
    connection: {
      filename: './test.sqlite3',
    },
    useNullAsDefault: true, // SQLite の警告回避
    pool: {
      afterCreate: (conn, cb) => {
        // 外部キーを有効化
        conn.run('PRAGMA foreign_keys = ON', cb);
      },
    },
    ...shared,
  },

  production: {
    client: 'pg',
    // 未実装とする。Renderへdeployする時に設定する。
    ...shared,
  },
};
