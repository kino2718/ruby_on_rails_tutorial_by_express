const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: 'uploads',

    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname)
        cb(null, uniqueName + ext)
    }
})

const upload = multer({ storage })

module.exports = upload
