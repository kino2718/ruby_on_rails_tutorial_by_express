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

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024  // 5MB
    }
})

module.exports = upload
