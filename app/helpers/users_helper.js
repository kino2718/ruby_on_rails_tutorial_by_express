const crypto = require('crypto')
const ejs = require('ejs')

function gravatarFor(user) {
    const email = user.email.toLowerCase()
    const gravatar_id = crypto.createHash('md5').update(email).digest('hex')
    const gravatar_url = `https://secure.gravatar.com/avatar/${gravatar_id}`
    return `<img class="gravatar" src="${gravatar_url}" alt="${user.name}" />`
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

function makeFormLabel(user, prop, forWhat, contents) {
    let escapedFor = ''
    if (forWhat) escapedFor = ejs.render('for="<%= forWhat %>"', { forWhat: forWhat })

    const escapedContents = ejs.render('<%= contents %>', { contents: contents })

    const labelEl = `<label ${escapedFor}>` + escapedContents + '</label>'

    // user.propの値がvalidかどうか確認する。
    const hasError = user && user.errors && user.errors.props && user.errors.props.includes(prop)

    const res = errorPrefix(hasError) + labelEl + errorSuffix(hasError)
    return res
}

function makeFormInput(user, prop, type, name, id) {
    let escapedType = ''
    if (type) escapedType = ejs.render('type="<%= type %>"', { type: type })

    let escapedValue = ''
    if (type !== 'password') {
        if (user) {
            const val = user[prop]
            if (val) escapedValue = ejs.render('value="<%= val %>"', { val: val })
        }
    }

    let escapedName = ''
    if (name) escapedName = ejs.render('name="<%= name %>"', { name: name })

    let escapedId = ''
    if (id) escapedId = ejs.render('id="<%= id %>"', { id: id })

    const inputEl = `<input class="form-control" ${escapedType} ${escapedValue} ${escapedName} ${escapedId} />`

    // user.propの値がvalidかどうか確認する。
    const hasError = user && user.errors && user.errors.props && user.errors.props.includes(prop)

    const res = errorPrefix(hasError) + inputEl + errorSuffix(hasError)
    return res
}

module.exports = {
    gravatarFor,
    makeFormLabel,
    makeFormInput,
}
