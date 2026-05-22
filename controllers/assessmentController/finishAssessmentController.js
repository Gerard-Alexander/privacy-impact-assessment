const prisma = require('../../store/prisma');

const finishAssessment = async (req, res) => {
  const piaAssessmentIdRaw = req.query.id || req.session.currentAssessmentId;
  const piaAssessmentId = Number.parseInt(piaAssessmentIdRaw, 10);

  if (!Number.isInteger(piaAssessmentId)) {
    return res.redirect('/dashboard');
  }

  try {
    req.session.currentAssessmentId = piaAssessmentId;

    await prisma.piaAssessment.update({
      where: { id: piaAssessmentId },
      data: {
        status: 'COMPLETED'
      }
    });

    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Error finishing assessment:', error);
    return res.redirect('/dashboard');
  }
};

module.exports = { finishAssessment };

