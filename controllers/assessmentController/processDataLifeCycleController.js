const prisma = require('../../store/prisma');

const authorizedParties = (req, res) => {
  res.locals.authParties = 'Process Data Lifecycle';
  
  const piaAssessmentId = req.query.id || req.session.currentAssessmentId;
  const success = req.query.saved === '1' ? 'Authorized parties saved successfully!' : null;
  
  if (!piaAssessmentId) {
    return res.redirect('/assessment');
  }
  return res.render('assessment/processdatalifecycle-page', {
    title: res.locals.processData,
    activePage: 'processdatalifecycle-page',
    user: req.session.user,
    piaAssessmentId,
    error: null,
    success
  });
};