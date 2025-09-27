# Ruby on Rails Tutorial by JavaScript + Express

これは、[*Ruby on Rails チュートリアル*](https://railstutorial.jp/)（第7版）の内容をあえて
JavaScript と Express で実装した Web アプリです。

本アプリは以下のライブラリを使用しています。
-   Express: Web framework
-   EJS: Embedded JavaScript templates
-   Bootstrap, sass: CSS framework
-   Jest, supertest, cheerio: Test tools
-   sqlite3: 開発環境用データベース Sqlite3 用。
-   pg: プロダクト環境用データベース PostgreSQL 用。
-   knex: SQL query builder. 開発環境用の Sqlite3 と プロダクト環境用の PostgreSQL を共存させるために使用。
    直接 SQL を書かなくても良くなる。
-   express_session: セッション管理用。
-   csrf: CSRF 対策用。
-   dotenv: 環境変数用。

## ローカルでの使い方

プロジェクトを clone し、アプリのトップディレクトリで
```bash
$ npm install
$ npm start
```

として下さい。

その後 Web Browser 等で localhost:3000 にアクセスして下さい。

ポート番号を指定する場合は環境変数 PORT にポート番号を指定して下さい。
例えば
```bash
PORT=3001 npm start
```
の様にして起動して下さい。

## 使用する環境変数
-   NODE_ENV: 開発には "development"、テストには "test"、プロダクト用には "production" を想定しています。
-   DEBUG: "express:*" を設定すると express がデバッグ用ログを出力します。
-   SQLITE_FILENAME: sqlite3 のデータベースのファイル名を指定します。指定のない場合は `./db/development.sqlite3` が使用されます。
-   SESSION_SECRET: セッション管理用の秘密鍵です。

## .scss ファイルのトランスパイル方法

アプリのトップディレクトリで
```bash
$ npm run build:css
```

とすることで .scss ファイルを .css ファイルにトランスパイルできます。

また
```bash
　npm run watch:css
```

とすることで .scss ファイルを変更すると自動的に .css ファイルにトランスパイルすることができます。

## テスト方法

アプリのトップディレクトリで
```bash
$ npm run test
```

として下さい。

ソースコード修正時に自動でテストが走るようにするには
```bash
$ npm run test:watch
```

として下さい。

テストは Jest + supertest + cheerio を使用しています。

またテスト時には `./db/test.sqlite3` というデータベースが一時的に作成されます。

## データベース作成

開発環境ではアプリのトップディレクトリで
```bash
$ npm run migrate:latest:dev
```

プロダクト環境では
```bash
$ npm run migrate:latest:prod
```

として下さい。

## コンソール機能

コンソール上でデバッグが行えます。

アプリのトップディレクトリで
```bash
$ npm run console
```

として下さい。

コンソール上で行ったデータベースへの書き込みを一時的なものにしたい場合は
```bash
$ npm run console:sandbox
```

として下さい。
`./db/tmp.sqlite3` という名前のデータベースを一時的に作成し、作業終了後に削除します。

コンソールの起動時に `./setup_console.js` が実行されます。
コンソール上でデバッグしたいクラス等は
```js
// setup_console.js
const User = require('./app/models/user')
global.User = User
```

等としておくとコンソール上で
```js
let user = new User()
```

等とできるので便利です。
