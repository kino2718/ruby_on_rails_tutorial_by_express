const util = require('util')

function getDebugOutput(req) {
    if (process.env.NODE_ENV !== 'development') return ''
    let p = {}
    if (req.method && 0 < req.method.length) p.method = req.method
    if (req.url && 0 < req.url.length) p.url = req.url
    if (req.query && 0 < Object.keys(req.query).length) p.query = _normalize(req.query)
    if (req.body && 0 < Object.keys(req.body).length) p.body = req.body
    return util.inspect(p, { depth: null, colors: false })
}

function getDebugOutputParams(req) {
    if (process.env.NODE_ENV !== 'development') return ''
    let p = {}
    if (req.params && 0 < Object.keys(req.params).length) p.params = _normalize(req.params)
    return util.inspect(p, { depth: null, colors: false })

}

// util.inspect時に出力される [Object: null prototype] を消す
function _normalize(obj) {
    return obj ? Object.assign({}, obj) : obj
    // または return obj ? { ...obj } : obj
}

function getFullUrl(req) {
    let url = `${req.protocol}://${req.get('host')}`
    if (url.at(-1) === '/') url = url.slice(0, -1)
    return url
}

module.exports = {
    getDebugOutput,
    getDebugOutputParams,
    getFullUrl,
}
