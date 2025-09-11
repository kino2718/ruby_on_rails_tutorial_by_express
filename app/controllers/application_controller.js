const express = require('express')
const static_pages_controller = require('./static_pages_controller')
const router = express.Router()

router.get('/', (req, res) => {
    static_pages_controller.home(req, res)
})

module.exports = {
    router,
}
