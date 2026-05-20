const prisma = require('../../store/prisma');

const formatThreatForForm = (threat) => {
  return {
    ...threat,
    typeOfThreatsArray: threat.typeOfThreats ? threat.typeOfThreats.split(',').map(s => s.trim()) : [],
    typeOfMeasureArray: threat.typeOfMeasure ? threat.typeOfMeasure.split(',').map(s => s.trim()) : []
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
  const piaAssessmentId = req.query.id || req.session.currentAssessmentId;

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
  const piaAssessmentId = Number.parseInt(req.body?.piaAssessment_id || req.session.currentAssessmentId, 10);
  const redirectTarget = req.body?.redirectTo === 'previous'
    ? `/assessment/personalinfoinventory?id=${piaAssessmentId}`
    : `/assessment/securitymeasures?id=${piaAssessmentId}`;
  const threatDescriptions = toArray(req.body.threatDescription);
  const threatTypes = toArray(req.body.threatType);
  const severityLevels = toArray(req.body.severityLevel);
  const likelihoodLevels = toArray(req.body.likelihoodLevel);
  const riskRatings = toArray(req.body.riskRating);
  const proposedControls = toArray(req.body.proposedControl);
  const measureTypes = toArray(req.body.measureType);
  const dataSubjectIds = toArray(req.body.dataSubjectId);
  const pdlcIds = toArray(req.body.pdlcId);

  console.log('Submitted data:', {
    piaAssessmentId,
    threatDescriptions: threatDescriptions.length,
    threatTypes: threatTypes.length,
    severityLevels: severityLevels.length,
    likelihoodLevels: likelihoodLevels.length,
    riskRatings: riskRatings.length,
    proposedControls: proposedControls.length,
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
    const severityLevels2 = toArray(req.body.severityLevel);
    const likelihoodLevels2 = toArray(req.body.likelihoodLevel);
    const riskRatings2 = toArray(req.body.riskRating);
    const proposedControls2 = toArray(req.body.proposedControl);
    const measureTypes2 = toArray(req.body.measureType);
    const dataSubjectIds2 = toArray(req.body.dataSubjectId);
    const pdlcIds2 = toArray(req.body.pdlcId);

    const rowCount = Math.max(
      threatDescriptions2.length,
      threatTypes2.length,
      severityLevels2.length,
      likelihoodLevels2.length,
      riskRatings2.length,
      proposedControls2.length,
      measureTypes2.length,
      dataSubjectIds2.length
    );

    if (!rowCount) {
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
      const severity = String(severityLevels[index] || '').trim();
      const likelihood = String(likelihoodLevels[index] || '').trim();
      const riskRatingStr = String(riskRatings[index] || '').trim();
      const riskRating = riskRatingStr ? Number.parseInt(riskRatingStr, 10) : 0;
      const proposedControl = String(proposedControls[index] || '').trim();
      const measureType = String(measureTypes[index] || '').trim();
      const dataSubjectIdStr = String(dataSubjectIds[index] || '').trim();
      const dataSubjectId = dataSubjectIdStr ? Number.parseInt(dataSubjectIdStr, 10) : 0;
      const pdlcIdStr = String(pdlcIds[index] || '').trim();
      const pdlcId = pdlcIdStr ? Number.parseInt(pdlcIdStr, 10) : 0;

      // Skip completely empty rows
      if (!threatDesc && !threatType && !severity && !likelihood && !proposedControl && !measureType && dataSubjectId === 0) {
        continue;
      }

      // Validate that filled rows have all required fields
      if (!threatDesc || !severity || !likelihood || riskRating === 0 || !proposedControl || dataSubjectId === 0) {
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
        });
        const pdlcData = await prisma.pDLC.findMany({
          where: { piaAssessment_id: piaAssessmentId }
        });

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
          error: 'Please complete all fields in each Threats and Controls row before saving.',
          success: null
        });
      }

      validatedRows.push({
        threatDesc,
        threatType,
        severity,
        likelihood,
        riskRating,
        proposedControl,
        measureType,
        dataSubjectId,
        pdlcId
      });
    }

    // Determine fallback PDLC id (use first PDLC for this assessment if pdlc not provided)
    const firstPdlc = await prisma.pDLC.findFirst({ where: { piaAssessment_id: piaAssessmentId } });
    const defaultPdlcId = firstPdlc ? firstPdlc.id : null;

    if (!defaultPdlcId && validatedRows.length > 0) {
      // If no PDLC exists in DB and user did not supply pdlc, prompt to add one (DB requires this FK)
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
      });
      const pdlcData = await prisma.pDLC.findMany({ where: { piaAssessment_id: piaAssessmentId } });

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
        error: 'No process (PDLC) found for this assessment. Please add at least one process before saving threats.',
        success: null
      });
    }

    // Delete existing threats for this assessment
    await prisma.threatsAndControl.deleteMany({
      where: { piaAssessment_id: piaAssessmentId }
    });

    // Create new threat records
    for (const row of validatedRows) {
      const usePdlcId = row.pdlcId && Number.isInteger(row.pdlcId) ? row.pdlcId : defaultPdlcId;
      await prisma.threatsAndControl.create({
        data: {
          piaAssessment_id: piaAssessmentId,
          dataSubject_id: row.dataSubjectId,
          pdlc_id: usePdlcId,
          threats_possibleConsequences: row.threatDesc,
          typeOfThreats: row.threatType,
          severityLevel: row.severity,
          likelihoodLevel: row.likelihood,
          riskRating: row.riskRating,
          proposedControl: row.proposedControl,
          typeOfMeasure: row.measureType
        }
      });
    }

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