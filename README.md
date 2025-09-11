# Ruby on Rails Tutorial by JavaScript + Express

これは、[*Ruby on Rails チュートリアル*](https://railstutorial.jp/)（第7版）の内容をあえて
JavaScript と Express で実装した Web アプリです。

## ローカルでの使い方

プロジェクトを clone し、アプリのトップディレクトリで
```bash
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

## テスト方法

アプリのトップディレクトリで
```bash
$ npm run test
```

として下さい。

テストは Jest + supertest を使用しています。
