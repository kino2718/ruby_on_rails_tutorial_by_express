# Ruby on Rails Tutorial by JavaScript + Express

これは、[*Ruby on Rails チュートリアル*](https://railstutorial.jp/)（第7版）の内容をあえて
JavaScript と Express で実装した Web アプリです。

本アプリは以下のライブラリを使用しています。
-   Express: Web framework
-   EJS: Embedded JavaScript templates
-   Bootstrap, sass: CSS framework
-   Jest, supertest, cheerio: Test tools

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
