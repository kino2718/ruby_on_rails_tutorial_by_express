function home(req, res) {
    res.render('static_pages/home')
}

function help(req, res) {
    res.render('static_pages/help')
}

module.exports = {
    home,
    help
}
