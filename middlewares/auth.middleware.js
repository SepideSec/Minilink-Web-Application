function isAuthenticated(req, res, next) {
	if (req.session.user) {
        //User is authenticated, call next middleware/route handler.
		return next()
	} else {
        //User is not authenticated, redirect to /login
		return res.redirect('/login')
	}
}

module.exports = { isAuthenticated }