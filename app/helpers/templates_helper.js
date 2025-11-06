const crypto = require('crypto')
const ejs = require('ejs')
const { format } = require('timeago.js')

function fullTitle(pageTitle = '') {
    const baseTitle = "Ruby on Rails Tutorial Sample App"
    if (!pageTitle) {
        return baseTitle
    } else {
        return `${pageTitle} | ${baseTitle}`
    }
}


function gravatarFor(user, options = { size: 80 }) {
    const email = user.email.toLowerCase()
    const gravatarId = crypto.createHash('md5').update(email).digest('hex')
    const gravatarUrl = `https://secure.gravatar.com/avatar/${gravatarId}?s=${options.size}`
    return `<img class="gravatar" src="${gravatarUrl}" alt="${user.name}" />`
}

const ERROR_PREFIX = '<div class="field_with_errors">'
const ERROR_SUFFIX = '</div>'

function errorPrefix(hasError) {
    if (hasError) return ERROR_PREFIX
    else return ''
}

function errorSuffix(hasError) {
    if (hasError) return ERROR_SUFFIX
    else return ''
}

function makeFormLabel(obj, prop, forWhat, contents) {
    let escapedFor = ''
    if (forWhat) escapedFor = ejs.render('for="<%= forWhat %>"', { forWhat: forWhat })

    const escapedContents = ejs.render('<%= contents %>', { contents: contents })

    const labelEl = `<label ${escapedFor}>` + escapedContents + '</label>'

    // user.propの値がvalidかどうか確認する。
    const hasError = obj && obj.errors && obj.errors.props && obj.errors.props.includes(prop)

    const res = errorPrefix(hasError) + labelEl + errorSuffix(hasError)
    return res
}

function makeFormInput(obj, prop, type, name, id) {
    let escapedType = ''
    if (type) escapedType = ejs.render('type="<%= type %>"', { type: type })

    let escapedValue = ''
    if (type !== 'password') {
        if (obj) {
            const val = obj[prop]
            if (val) escapedValue = ejs.render('value="<%= val %>"', { val: val })
        }
    }

    let escapedName = ''
    if (name) escapedName = ejs.render('name="<%= name %>"', { name: name })

    let escapedId = ''
    if (id) escapedId = ejs.render('id="<%= id %>"', { id: id })

    const inputEl = `<input class="form-control" ${escapedType} ${escapedValue} ${escapedName} ${escapedId} />`

    // user.propの値がvalidかどうか確認する。
    const hasError = obj && obj.errors && obj.errors.props && obj.errors.props.includes(prop)

    const res = errorPrefix(hasError) + inputEl + errorSuffix(hasError)
    return res
}

function paginate(pagination, baseUrl) {
    let html = '<nav aria-label="Page navigation"><ul class="pagination">'

    const prevPage = Math.min(Math.max(1, pagination.current - 1), pagination.totalPages)
    const disablePrev = pagination.current === 1 ? 'disabled' : ''
    html += `
      <li class="page-item ${disablePrev}">
        <a class="page-link" href="${baseUrl}?page=${prevPage}">&#8592; Previous</a>
      </li>
    `

    for (let i = 1; i <= pagination.totalPages; i++) {
        const active = i === pagination.current ? 'active' : ''
        html += `
      <li class="page-item ${active}">
        <a class="page-link" href="${baseUrl}?page=${i}">${i}</a>
      </li>
    `
    }

    const nextPage = Math.min(Math.max(1, pagination.current + 1), pagination.totalPages)
    const disableNext = pagination.current === pagination.totalPages ? 'disabled' : ''
    html += `
      <li class="page-item ${disableNext}">
        <a class="page-link" href="${baseUrl}?page=${nextPage}">Next &#8594;</a>
      </li>
    `

    html += '</ul></nav>'
    return html
}

function timeAgoInWords(dateOrString) {
    if (!dateOrString) return ''

    // knex + PostgreSQL なら Date オブジェクト、SQLite だと文字列のこともあるので両方対応
    // UTC時刻なので文字列の場合は末尾に 'Z' を追加する
    let date = dateOrString instanceof Date ?
        dateOrString :
        new Date(dateOrString.endsWith('Z') ?
            dateOrString :
            dateOrString + 'Z')

    if (Number.isNaN(date.getTime())) {
        return ''
    }

    // "3 minutes ago", "in 2 hours" など英語
    return format(date)
}

module.exports = {
    fullTitle,
    gravatarFor,
    makeFormLabel,
    makeFormInput,
    paginate,
    timeAgoInWords,
}
