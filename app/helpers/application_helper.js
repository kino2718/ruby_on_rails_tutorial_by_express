function full_title(page_title = '') {
    const base_title = "Ruby on Rails Tutorial Sample App"
    if (!page_title) {
        return base_title
    } else {
        return `${page_title} | ${base_title}`
    }
}

module.exports = {
    full_title,
}
