const express = require('express')
const app_cont = require('./controllers/application_controller')
const app = express()

app.get('/', (req, res) => {
  res.send(app_cont.hello())
})

const port = 3000
app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})
