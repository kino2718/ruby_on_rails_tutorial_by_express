const express = require('express')
const router = express.Router()
const csrfHelper = require('../helpers/csrf_helper')
const sessionsHelper = require('../helpers/sessions_helper')
const uploadHelper = require('../helpers/upload_helper')
const verifyCsrfToken = csrfHelper.verifyCsrfToken
const loggedInUser = sessionsHelper.loggedInUser
const Image = require('../models/image')

router.post('/', uploadHelper.single('micropost[image]'), verifyCsrfToken, loggedInUser, async (req, res) => {
    await create(req, res)
})

router.post('/:id/delete', verifyCsrfToken, loggedInUser, async (req, res) => {
    await destroy(req, res)
})

async function create(req, res) {
    const params = filterSafeParams(req.body.micropost)
    const user = await sessionsHelper.currentUser(req)
    const micropost = user.microposts.build(params)
    // 画像がある場合は画像情報を保存
    let imageParams
    if (req.file) {
        const file = req.file
        imageParams = { fileName: file.path, mimeType: file.mimetype, size: file.size }
        micropost.image = imageParams
    }
    if (await micropost.save()) {
        // 画像がある場合は画像情報を保存
        if (req.file) {
            imageParams.micropostId = micropost.id // micropost id を追加。
            await Image.create(imageParams)
        }
        req.flash('success', 'Micropost created!')
        res.redirect('/')
    } else {
        // pagination
        const page = parseInt(req.query.page) || 1
        const perPage = 30
        const offset = (page - 1) * perPage
        const feedItems = await user.feed(perPage, offset)
        const totalCount = await user.feedCount()
        const totalPages = Math.ceil(totalCount / perPage)
        const feedUsers = []
        for (const m of feedItems) {
            feedUsers.push(await m.user())
        }
        res.status(422).render('static_pages/home', {
            micropost: micropost, feedItems: feedItems, feedUsers: feedUsers, pagination: { current: page, totalPages: totalPages }
        })
    }
}

async function destroy(req, res) {
    const id = req.params.id
    const currentUser = await sessionsHelper.currentUser(req)
    const microposts = await currentUser?.microposts.findBy({ id: id })
    const micropost = microposts?.at(0)
    if (!micropost) {
        res.redirect('/')
    } else {
        await micropost.destroy()
        req.flash('success', 'Micropost deleted')
        const referer = req.headers.referer
        if (!referer) res.redirect('/')
        else res.redirect(referer)
    }
}

function filterSafeParams(params) {
    const filtered = {}
    filtered.content = params.content
    return filtered
}

module.exports = {
    router,
}
