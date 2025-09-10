function home(req, res) {
    res.render('static_pages/home')
}

function help(req, res) {
    res.render('static_pages/help')
}

function about(req, res) {
    res.render('static_pages/about')
}

module.exports = {
    home,
    help,
    about,
}
