require('dotenv').config() // 環境変数の設定
const app = require('./app')

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})
