const prisma = require('../../store/prisma');

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'undefined' || value === null) {
    return [];
  }
  return [value];
};

const securityMeasures = async (req, res) => {
  res.locals.securityMeasuresTitle = 'Security Measures';
  const piaAssessmentId = req.query.id || req.session.currentAssessmentId;

  if (!piaAssessmentId) {
    return res.redirect('/assessment');
  }

  try {
    const [existingSecurityMeasures, existingAssessment] = await Promise.all([
      prisma.securityMeasures.findMany({
        where: { piaAssessment_id: parseInt(piaAssessmentId, 10) }
      }),
      prisma.piaAssessment.findUnique({
        where: { id: parseInt(piaAssessmentId, 10) }
      })
    ]);

    const securityTypeOptions = ['TECHNICAL', 'ORGANIZATIONAL', 'PHYSICAL'];

    return res.render('assessment/securitymeasures-page', {
      title: res.locals.securityMeasuresTitle,
      activePage: 'securitymeasures-page',
      user: req.session.user,
      piaAssessmentId: piaAssessmentId,
      securityData: existingSecurityMeasures.length > 0 ? existingSecurityMeasures : null,
      assessment: existingAssessment,
      securityTypeOptions,
      error: null,
      success: req.query.saved === '1' ? 'Security Measures saved successfully!' : null
    });
  } catch (error) {
    console.error('Error fetching security measures data:', error);
    return res.redirect('/assessment');
  }
};

const saveSecurityMeasures = async (req, res) => {
  const piaAssessmentId = Number.parseInt(req.body?.piaAssessment_id || req.session.currentAssessmentId, 10);
  const securityTypes = toArray(req.body.securityType);
  const descriptions = toArray(req.body.description);

  const isDataTransferredOutsidePh = req.body.isDataTransferredOutsidePh === 'true';
  const hasDataSharingAgreement = req.body.hasDataSharingAgreement === 'true';
  const pipName = req.body.pipName || null;
  const isPublicFacing = req.body.isPublicFacing || null;
  const hasAutomatedDecisionMaking = req.body.hasAutomatedDecisionMaking === 'true';
  const hasProfiling = req.body.hasProfiling === 'true';
  const legalBasis = req.body.legalBasis || null;
  const otherLegalBasisInfo = req.body.otherLegalBasisInfo || null;
  const isConsentUsed = req.body.isConsentUsed === 'true';
  const consentProof = req.body.consentProof || null;

  if (!Number.isInteger(piaAssessmentId)) {
    return res.redirect('/assessment');
  }

  try {
    req.session.currentAssessmentId = piaAssessmentId;

    const rowCount = Math.max(securityTypes.length, descriptions.length);

    if (!rowCount) {
      // Allow empty submission - clear existing
      await prisma.securityMeasures.deleteMany({
        where: { piaAssessment_id: piaAssessmentId }
      });
      return res.redirect('/dashboard');
    }

    const validatedRows = [];

    for (let index = 0; index < rowCount; index += 1) {
      const securityType = String(securityTypes[index] || '').trim();
      const description = String(descriptions[index] || '').trim();

      if (!securityType && !description) {
        continue;
      }

      if (!securityType || !description) {
        const securityTypeOptions = ['TECHNICAL', 'ORGANIZATIONAL', 'PHYSICAL'];
        return res.render('assessment/securitymeasures-page', {
          title: 'Security Measures',
          activePage: 'securitymeasures-page',
          user: req.session.user,
          piaAssessmentId,
          securityData: null,
          securityTypeOptions,
          error: 'Please complete all fields in each Security Measures row before saving.',
          success: null
        });
      }

      validatedRows.push({
        securityType,
        description
      });
    }

    // Delete existing
    await prisma.securityMeasures.deleteMany({
      where: { piaAssessment_id: piaAssessmentId }
    });

    // Create new
    for (const row of validatedRows) {
      await prisma.securityMeasures.create({
        data: {
          piaAssessment_id: piaAssessmentId,
          securityType: row.securityType,
          description: row.description
        }
      });
    }

    // Update the static questions in PiaAssessment
    await prisma.piaAssessment.update({
      where: { id: piaAssessmentId },
      data: {
        isDataTransferredOutsidePh,
        hasDataSharingAgreement,
        pipName,
        isPublicFacing,
        hasAutomatedDecisionMaking,
        hasProfiling,
        legalBasis,
        otherLegalBasisInfo,
        isConsentUsed,
        consentProof
      }
    });

    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Error saving security measures:', error);
    const securityTypeOptions = ['TECHNICAL', 'ORGANIZATIONAL', 'PHYSICAL'];
    return res.render('assessment/securitymeasures-page', {
      title: 'Security Measures',
      activePage: 'securitymeasures-page',
      user: req.session.user,
      piaAssessmentId,
      securityData: null,
      securityTypeOptions,
      error: 'An error occurred while saving. Please try again.',
      success: null
    });
  }
};

module.exports = {
  securityMeasures,
  saveSecurityMeasures
};
