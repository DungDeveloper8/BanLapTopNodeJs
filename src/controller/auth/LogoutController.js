function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("laptop.sid");

    return res.redirect("/");
  });
}

module.exports = {
  logout,
};
