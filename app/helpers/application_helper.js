const util = require('util')

function full_title(page_title = '') {
    const base_title = "Ruby on Rails Tutorial Sample App"
    if (!page_title) {
        return base_title
    } else {
        return `${page_title} | ${base_title}`
    }
}

function getDebugOutput(req) {
    if (process.env.NODE_ENV !== 'development') return ''
    let p = {}
    if (req.method && 0 < req.method.length) p.method = req.method
    if (req.url && 0 < req.url.length) p.url = req.url
    if (req.params && 0 < req.params.length) p.params = req.params
    if (req.query && 0 < req.query.length) p.query = req.query
    if (req.body && 0 < req.body.length) p.body = req.body
    return util.inspect(p, { depth: null, colors: false })
}

module.exports = {
    full_title,
    getDebugOutput,
}
