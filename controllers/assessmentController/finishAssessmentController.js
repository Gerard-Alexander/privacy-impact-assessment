const prisma = require('../../store/prisma');

const finishAssessment = async (req, res) => {
  const piaAssessmentIdRaw = req.query.id || req.session.currentAssessmentId;
  const piaAssessmentId = Number.parseInt(piaAssessmentIdRaw, 10);

  if (!Number.isInteger(piaAssessmentId)) {
    return res.redirect('/dashboard');
  }

  try {
    req.session.currentAssessmentId = piaAssessmentId;

    // Verify Section F (Security Measures) is filled
    const securityMeasuresCount = await prisma.securityMeasures.count({
      where: { piaAssessment_id: piaAssessmentId }
    });

    if (securityMeasuresCount === 0) {
      return res.redirect(`/assessment/securitymeasures?id=${piaAssessmentId}&error=Section F (Security Measures) must be filled before finishing the assessment.`);
    }

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

