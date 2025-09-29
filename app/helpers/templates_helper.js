const crypto = require('crypto')
const ejs = require('ejs')

function fullTitle(pageTitle = '') {
    const baseTitle = "Ruby on Rails Tutorial Sample App"
    if (!pageTitle) {
        return baseTitle
    } else {
        return `${pageTitle} | ${baseTitle}`
    }
}


function gravatarFor(user) {
    const email = user.email.toLowerCase()
    const gravatarId = crypto.createHash('md5').update(email).digest('hex')
    const gravatarUrl = `https://secure.gravatar.com/avatar/${gravatarId}`
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

module.exports = {
    fullTitle,
    gravatarFor,
    makeFormLabel,
    makeFormInput,
}
