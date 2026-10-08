const prisma = require('../../store/prisma');

const formatThreatForForm = (threat) => {
  return {
    ...threat,
    typeOfThreatsArray: threat.typeOfThreats ? threat.typeOfThreats.split(',').map(s => s.trim()) : [],
    typeOfMeasureArray: threat.typeOfMeasure ? threat.typeOfMeasure.split(',').map(s => s.trim()) : [],
    proposedTypeOfMeasureArray: threat.proposedTypeOfMeasure ? threat.proposedTypeOfMeasure.split(',').map(s => s.trim()) : []
  };
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'undefined' || value === null) {
    return [];
  }

  return [value];
};

const threatsAndControls = async (req, res) => {
  res.locals.threatsAndControls = 'Threats and Controls';
  const piaAssessmentId = Number.parseInt(req.query.id || req.body?.piaAssessmentId || req.body?.piaAssessment_id || req.session.currentAssessmentId, 10);

  if (!piaAssessmentId) {
    return res.redirect('/assessment');
  }

  try {
    const [existingThreatsAndControls, existingDataSubjects, existingPdlc] = await Promise.all([
      prisma.threatsAndControl.findMany({
        where: { piaAssessment_id: parseInt(piaAssessmentId, 10) },
        include: {
          dataSubjects: {
            include: {
              dataSubjectType: true,
              pii: true
            }
          },
          pdlc: true
        }
      }),
      prisma.piiDatasubject.findMany({
        where: {
          pii: {
            piaAssessment_id: parseInt(piaAssessmentId, 10)
          }
        },
        include: {
          dataSubjectType: true,
          pii: true
        },
        orderBy: { id: 'asc' }
      }),
      prisma.pDLC.findMany({
        where: { piaAssessment_id: parseInt(piaAssessmentId, 10) }
      })
    ]);

    const mappedThreats = existingThreatsAndControls.map(formatThreatForForm);

    const threatTypeOptions = ['CONFIDENTIALITY', 'INTEGRITY', 'AVAILABILITY', 'UNAUTHORIZED_PROCESSING', 'VIOLATION'];
    const measureTypeOptions = ['PHYSICAL', 'TECHNICAL', 'ORGANIZATIONAL'];
    const severityOptions = ['NEGLIGIBLE_1', 'LIMITED_2', 'SIGNIFICANT_3', 'EXTREME_4'];
    const likelihoodOptions = ['UNLIKELY_1', 'POSSIBLE_2', 'LIKELY_3', 'ALMOST_CERTAIN_4'];

    return res.render('assessment/threatsandncontrol-page', {
      title: res.locals.threatsAndControls,
      activePage: 'threatsandncontrol-page',
      user: req.session.user,
      piaAssessmentId: piaAssessmentId,
      threatsData: mappedThreats.length > 0 ? mappedThreats : null,
      dataSubjects: existingDataSubjects,
      pdlcData: existingPdlc,
      threatTypeOptions,
      measureTypeOptions,
      severityOptions,
      likelihoodOptions,
      error: null,
      success: req.query.saved === '1' ? 'Threats and Controls saved successfully!' : null
    });
  } catch (error) {
    console.error('Error fetching threats and controls data:', error);
    return res.redirect('/assessment');
  }
};

const saveThreatsAndControls = async (req, res) => {
  const piaAssessmentId = Number.parseInt(req.query.id || req.body?.piaAssessment_id || req.body?.piaAssessmentId || req.session.currentAssessmentId, 10);
  const isPrevious = req.body?.redirectTo === 'previous';
  const redirectTarget = isPrevious
    ? `/assessment/personalinfoinventory?id=${piaAssessmentId}`
    : `/assessment/securitymeasures?id=${piaAssessmentId}`;
  const threatDescriptions = toArray(req.body.threatDescription);
  const threatTypes = toArray(req.body.threatType);
  const currentSeverityLevels = toArray(req.body.currentSeverityLevel);
  const currentLikelihoodLevels = toArray(req.body.currentLikelihoodLevel);
  const currentRiskRatings = toArray(req.body.currentRiskRating);
  const currentControls = toArray(req.body.currentControl);
  const proposedControls = toArray(req.body.proposedControl);
  const proposedSeverityLevels = toArray(req.body.proposedSeverityLevel);
  const proposedLikelihoodLevels = toArray(req.body.proposedLikelihoodLevel);
  const proposedRiskRatings = toArray(req.body.proposedRiskRating);
  const proposedMeasureTypes = toArray(req.body.proposedMeasureType);
  const afterSeverityLevels = toArray(req.body.afterSeverityLevel);
  const afterLikelihoodLevels = toArray(req.body.afterLikelihoodLevel);
  const afterRiskRatings = toArray(req.body.afterRiskRating);
  const measureTypes = toArray(req.body.measureType);
  const dataSubjectIds = toArray(req.body.dataSubjectId);
  const pdlcIds = toArray(req.body.pdlcId);

  console.log('Submitted data:', {
    piaAssessmentId,
    threatDescriptions: threatDescriptions.length,
    threatTypes: threatTypes.length,
    currentSeverityLevels: currentSeverityLevels.length,
    currentLikelihoodLevels: currentLikelihoodLevels.length,
    currentRiskRatings: currentRiskRatings.length,
    currentControls: currentControls.length,
    proposedControls: proposedControls.length,
    proposedSeverityLevels: proposedSeverityLevels.length,
    proposedLikelihoodLevels: proposedLikelihoodLevels.length,
    proposedRiskRatings: proposedRiskRatings.length,
    proposedMeasureTypes: proposedMeasureTypes.length,
    afterSeverityLevels: afterSeverityLevels.length,
    afterLikelihoodLevels: afterLikelihoodLevels.length,
    afterRiskRatings: afterRiskRatings.length,
    measureTypes: measureTypes.length,
    dataSubjectIds: dataSubjectIds.length,
    pdlcIds: pdlcIds.length
  });

  if (!Number.isInteger(piaAssessmentId)) {
    return res.redirect('/assessment');
  }

  try {
    req.session.currentAssessmentId = piaAssessmentId;



    // Re-read arrays from body to ensure consistent values
    const threatDescriptions2 = toArray(req.body.threatDescription);
    const threatTypes2 = toArray(req.body.threatType);
    const currentSeverityLevels2 = toArray(req.body.currentSeverityLevel);
    const currentLikelihoodLevels2 = toArray(req.body.currentLikelihoodLevel);
    const currentRiskRatings2 = toArray(req.body.currentRiskRating);
    const currentControls2 = toArray(req.body.currentControl);
    const proposedControls2 = toArray(req.body.proposedControl);
    const proposedSeverityLevels2 = toArray(req.body.proposedSeverityLevel);
    const proposedLikelihoodLevels2 = toArray(req.body.proposedLikelihoodLevel);
    const proposedRiskRatings2 = toArray(req.body.proposedRiskRating);
    const proposedMeasureTypes2 = toArray(req.body.proposedMeasureType);
    const afterSeverityLevels2 = toArray(req.body.afterSeverityLevel);
    const afterLikelihoodLevels2 = toArray(req.body.afterLikelihoodLevel);
    const afterRiskRatings2 = toArray(req.body.afterRiskRating);
    const measureTypes2 = toArray(req.body.measureType);
    const dataSubjectIds2 = toArray(req.body.dataSubjectId);
    const pdlcIds2 = toArray(req.body.pdlcId);

    const rowCount = Math.max(
      threatDescriptions2.length,
      threatTypes2.length,
      currentSeverityLevels2.length,
      currentLikelihoodLevels2.length,
      currentRiskRatings2.length,
      currentControls2.length,
      proposedControls2.length,
      proposedSeverityLevels2.length,
      proposedLikelihoodLevels2.length,
      proposedRiskRatings2.length,
      proposedMeasureTypes2.length,
      afterSeverityLevels2.length,
      afterLikelihoodLevels2.length,
      afterRiskRatings2.length,
      measureTypes2.length,
      dataSubjectIds2.length
    );

    if (!rowCount) {
      if (isPrevious) {
        return res.redirect(redirectTarget);
      }

      // Allow empty submission - just clear any existing threats
      await prisma.threatsAndControl.deleteMany({
        where: { piaAssessment_id: piaAssessmentId }
      });
      return res.redirect(redirectTarget);
    }
    const validatedRows = [];

    for (let index = 0; index < rowCount; index += 1) {
      const threatDesc = String(threatDescriptions[index] || '').trim();
      const threatType = String(threatTypes[index] || '').trim();
      const currentSeverity = String(currentSeverityLevels[index] || '').trim();
      const currentLikelihood = String(currentLikelihoodLevels[index] || '').trim();
      const currentRiskRatingStr = String(currentRiskRatings[index] || '').trim();
      const currentRiskRating = currentRiskRatingStr ? Number.parseInt(currentRiskRatingStr, 10) : 0;
      const currentControl = String(currentControls[index] || '').trim();
      const proposedControl = String(proposedControls[index] || '').trim();
      const proposedSeverity = String(proposedSeverityLevels[index] || '').trim();
      const proposedLikelihood = String(proposedLikelihoodLevels[index] || '').trim();
      const proposedRiskRatingStr = String(proposedRiskRatings[index] || '').trim();
      const proposedRiskRating = proposedRiskRatingStr ? Number.parseInt(proposedRiskRatingStr, 10) : 0;
      const proposedMeasureType = String(proposedMeasureTypes[index] || '').trim();
      const afterSeverity = String(afterSeverityLevels[index] || '').trim();
      const afterLikelihood = String(afterLikelihoodLevels[index] || '').trim();
      const afterRiskRatingStr = String(afterRiskRatings[index] || '').trim();
      const afterRiskRating = afterRiskRatingStr ? Number.parseInt(afterRiskRatingStr, 10) : 0;
      const measureType = String(measureTypes[index] || '').trim();
      const dataSubjectIdStr = String(dataSubjectIds[index] || '').trim();
      const dataSubjectId = dataSubjectIdStr ? Number.parseInt(dataSubjectIdStr, 10) : 0;
      const pdlcIdStr = String(pdlcIds[index] || '').trim();
      const pdlcId = pdlcIdStr ? Number.parseInt(pdlcIdStr, 10) : 0;

      // Skip completely empty rows
      if (!threatDesc && !threatType && !currentControl && !currentSeverity && !currentLikelihood && !proposedControl && !proposedSeverity && !proposedLikelihood && !proposedMeasureType && !afterSeverity && !afterLikelihood && !measureType) {
        continue;
      }

      // Keep row even if partial, especially if we are navigating backward
      validatedRows.push({
        threatDesc,
        threatType,
        currentControl,
        currentSeverity: currentSeverity || null,
        currentLikelihood: currentLikelihood || null,
        currentRiskRating: currentRiskRating || 0,
        proposedControl,
        proposedSeverity: proposedSeverity || null,
        proposedLikelihood: proposedLikelihood || null,
        proposedRiskRating: proposedRiskRating || 0,
        proposedMeasureType,
        afterSeverity: afterSeverity || null,
        afterLikelihood: afterLikelihood || null,
        afterRiskRating: afterRiskRating || 0,
        measureType,
        dataSubjectId: dataSubjectId || 0,
        pdlcId: pdlcId || 0
      });
    }

    // Always clear and save if we have any pending data or if we are navigating
    // This ensures that "Previous Page" button saves the current state.
    // Even if validatedRows is empty, we delete and "save" nothing (effectively clearing).
    
    // Determine fallback PDLC id if any threats missing it
    const firstPdlc = await prisma.pDLC.findFirst({ where: { piaAssessment_id: piaAssessmentId } });
    const defaultPdlcId = firstPdlc ? firstPdlc.id : null;

    // Use a transaction to ensure atomic delete and create
    await prisma.$transaction([
      // Delete existing threats for this assessment
      prisma.threatsAndControl.deleteMany({
        where: { piaAssessment_id: piaAssessmentId }
      }),
      // Create new threat records
      ...validatedRows
        .filter(row => row.dataSubjectId !== 0 && (row.pdlcId || defaultPdlcId))
        .map(row => prisma.threatsAndControl.create({
          data: {
            piaAssessment_id: piaAssessmentId,
            dataSubject_id: row.dataSubjectId,
            pdlc_id: row.pdlcId && Number.isInteger(row.pdlcId) ? row.pdlcId : defaultPdlcId,
            threats_possibleConsequences: row.threatDesc || null,
            typeOfThreats: row.threatType || null,
            currentControl: row.currentControl || null,
            currentSeverityLevel: row.currentSeverity,
            currentLikelihoodLevel: row.currentLikelihood,
            currentRiskRating: row.currentRiskRating,
            proposedControl: row.proposedControl || null,
            proposedSeverityLevel: row.proposedSeverity,
            proposedLikelihoodLevel: row.proposedLikelihood,
            proposedRiskRating: row.proposedRiskRating,
            proposedTypeOfMeasure: row.proposedMeasureType || null,
            afterSeverityLevel: row.afterSeverity,
            afterLikelihoodLevel: row.afterLikelihood,
            afterRiskRating: row.afterRiskRating,
            typeOfMeasure: row.measureType || null
          }
        }))
    ]);

    return res.redirect(redirectTarget);
  } catch (error) {
    console.error('Error saving threats and controls:', error);
    const dataSubjects = await prisma.piiDatasubject.findMany({
      where: {
        pii: {
          piaAssessment_id: piaAssessmentId
        }
      },
      include: {
        dataSubjectType: true,
        pii: true
      },
      orderBy: { id: 'asc' }
    }).catch(() => []);
    const pdlcData = await prisma.pDLC.findMany({
      where: { piaAssessment_id: piaAssessmentId }
    }).catch(() => []);

    const threatTypeOptions = ['CONFIDENTIALITY', 'INTEGRITY', 'AVAILABILITY', 'AUTHENTICITY', 'NON_REPUDIATION'];
    const measureTypeOptions = ['PHYSICAL', 'TECHNICAL', 'ORGANIZATIONAL'];
    const severityOptions = ['NEGLIGIBLE_1', 'LIMITED_2', 'SIGNIFICANT_3', 'EXTREME_4'];
    const likelihoodOptions = ['UNLIKELY_1', 'POSSIBLE_2', 'LIKELY_3', 'ALMOST_CERTAIN_4'];

    return res.render('assessment/threatsandncontrol-page', {
      title: res.locals.threatsAndControls,
      activePage: 'threatsandncontrol-page',
      user: req.session.user,
      piaAssessmentId,
      threatsData: null,
      dataSubjects,
      pdlcData,
      threatTypeOptions,
      measureTypeOptions,
      severityOptions,
      likelihoodOptions,
      error: 'An error occurred while saving. Please try again.',
      success: null
    });
  }
};

module.exports = {
  threatsAndControls,
  saveThreatsAndControls
};