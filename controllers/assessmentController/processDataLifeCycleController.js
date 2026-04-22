const prisma = require('../../store/prisma');

const processDataLifeCycle = (req, res) => {
  res.locals.processDataCycle = 'Process Data LifeCycle';

  const piaAssessmentId = req.query.id || req.session.currentAssessmentId;

  if (!piaAssessmentId) {
    return res.redirect('/assessment');
  }

  return res.render('assessment/processdatalifecycle-page', {
    title: res.locals.processDataCycle,
    activePage: 'processdatalifecycle-page',
    user: req.session.user,
    piaAssessmentId,
    error: null,
    success: req.query.saved === '1' ? 'Process data cycle saved successfully!' : null
  });
};

const saveProcessDataLifeCycle = async (req, res) => {
  const piaAssessmentId = Number.parseInt(req.body?.piaAssessment_id || req.session.currentAssessmentId, 10);

  if (!Number.isInteger(piaAssessmentId)) {
    return res.redirect('/assessment');
  }

  req.session.currentAssessmentId = piaAssessmentId;
  return res.redirect(`/assessment/processdatalifecycle?id=${piaAssessmentId}&saved=1`);
};

module.exports = {
  processDataLifeCycle,
  saveProcessDataLifeCycle
};