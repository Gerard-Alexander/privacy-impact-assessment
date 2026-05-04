const prisma = require('../../store/prisma');

const processDataLifeCycle = async (req, res) => {
  res.locals.processDataCycle = 'Process Data LifeCycle';

  const piaAssessmentId = req.query.id || req.session.currentAssessmentId;

  if (!piaAssessmentId) {
    return res.redirect('/assessment');
  }

  try {
    const existingPdlc = await prisma.pDLC.findMany({
      where: { piaAssessment_id: parseInt(piaAssessmentId, 10) }
    });

    return res.render('assessment/processdatalifecycle-page', {
      title: res.locals.processDataCycle,
      activePage: 'processdatalifecycle-page',
      user: req.session.user,
      piaAssessmentId,
      pdlcData: existingPdlc.length > 0 ? existingPdlc : null,
      error: null,
      success: req.query.saved === '1' ? 'Process data cycle saved successfully!' : null
    });
  } catch (error) {
    console.error('Error fetching PDLC data:', error);
    return res.redirect('/assessment');
  }
};

const saveProcessDataLifeCycle = async (req, res) => {
  const piaAssessmentId = Number.parseInt(req.body?.piaAssessment_id || req.session.currentAssessmentId, 10);

  if (!Number.isInteger(piaAssessmentId)) {
    return res.redirect('/assessment');
  }

  try {
    req.session.currentAssessmentId = piaAssessmentId;

    // Delete dependent ThreatsAndControl records first to avoid FK violations,
    // then delete PDLC records to overwrite with new ones
    await prisma.threatsAndControl.deleteMany({ where: { piaAssessment_id: piaAssessmentId } }).catch(() => {});
    await prisma.pDLC.deleteMany({ where: { piaAssessment_id: piaAssessmentId } });

    // Check if there's any data to save
    if (req.body.stakeholderName) {
      if (Array.isArray(req.body.stakeholderName)) {
        // Multiple rows submitted
        const pdlcToInsert = req.body.stakeholderName.map((name, index) => {
          return {
            piaAssessment_id: piaAssessmentId,
            stakeholderName: name,
            collection: req.body.collection[index] || '',
            useOfData: req.body.useOfData[index] || '',
            process: req.body.process[index] || '',
            dataSharing: req.body.dataSharing[index] || '',
            disposalMethod: req.body.disposalMethod[index] || '',
            // Empty strings for required schema fields not in UI
            dateCollected: req.body.dateCollected[index] || '',
            retentionPeriod: req.body.retentionPeriod[index] || '',
            retentionDate: req.body.retentionDate && req.body.retentionDate[index] ? new Date(req.body.retentionDate[index]) : null,
            sharedTo: req.body.sharedTo && req.body.sharedTo[index] ? req.body.sharedTo[index] : ''
          };
        });

        await prisma.pDLC.createMany({
          data: pdlcToInsert
        });
      } else {
        // Single row submitted
        await prisma.pDLC.create({
          data: {
            piaAssessment_id: piaAssessmentId,
            stakeholderName: req.body.stakeholderName,
            collection: req.body.collection || '',
            useOfData: req.body.useOfData || '',
            process: req.body.process || '',
            dataSharing: req.body.dataSharing || '',
            disposalMethod: req.body.disposalMethod || '',
            // Save new UI fields
            dateCollected: req.body.dateCollected || '',
            retentionPeriod: req.body.retentionPeriod || '',
            retentionDate: req.body.retentionDate ? new Date(req.body.retentionDate) : null,
            sharedTo: req.body.sharedTo || ''
          }
        });
      }
    }

    return res.redirect(`/assessment/personalinfoinventory?id=${piaAssessmentId}`);
  } catch (error) {
    console.error('Error saving PDLC:', error);
    return res.render('assessment/processdatalifecycle-page', {
        title: res.locals.processDataCycle,
        activePage: 'processdatalifecycle-page',
        user: req.session.user,
        piaAssessmentId,
        pdlcData: null,
        error: 'An error occurred while saving. Please try again.',
        success: null
    });
  }
};

module.exports = {
  processDataLifeCycle,
  saveProcessDataLifeCycle
};