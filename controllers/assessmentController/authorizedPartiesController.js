const prisma = require('../../store/prisma');

const authorizedParties = (req, res) => {
  res.locals.authParties = 'Authorized Parties';

  return res.render('assessment/authorizedparties-page', {
    title: res.locals.authParties,
    activePage: 'authorizedparties-page',
    user: req.session.user,
    error: null,
    success: null
  });
};
module.exports = {
  authorizedParties
}