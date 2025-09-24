const crypto = require("crypto")

function gravatar_for(user) {
    const email = user.email.toLowerCase()
    const gravatar_id = crypto.createHash("md5").update(email).digest("hex")
    const gravatar_url = `https://secure.gravatar.com/avatar/${gravatar_id}`
    return `<img class="gravatar" src="${gravatar_url}" alt="${user.name}" />`
}

module.exports = {
    gravatar_for,
}
