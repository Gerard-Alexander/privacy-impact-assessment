 const prisma = require('../../store/prisma');


const personalInfoInventory = async (req, res) => {
  res.locals.personalInfoInventory = 'Personal Information Inventory';

  const piiAssessmentId = req.query.id || req.session.currentAssessmentId;

  if (!piiAssessmentId) {
    return res.redirect('/assessment');
  }

  try {
    const existingPii = await prisma.pDLC.findMany({
      where: { piaAssessment_id: parseInt(piiAssessmentId, 10) }
    });

    return res.render('assessment/personalinfoinventory-page', {
      title: res.locals.personalInfoInventory,
      activePage: 'personalinfoinventory-page',
      user: req.session.user,
      piiAssessmentId,
      pdlcData: existingPii.length > 0 ? existingPii : null,
      error: null,
      success: req.query.saved === '1' ? 'Personal information inventory saved successfully!' : null
    });
  } catch (error) {
    console.error('Error fetching PDLC data:', error);
    return res.redirect('/assessment');
  }
};


const savePersonalInfoInventory = async (req, res) => {
  const piaAssessmentId = Number.parseInt(req.body?.piaAssessment_id || req.session.currentAssessmentId, 10);

  if (!Number.isInteger(piaAssessmentId)) {
    return res.redirect('/assessment');
  }

  try {
    req.session.currentAssessmentId = piaAssessmentId;

    // Delete existing records to overwrite with the new ones
    await prisma.pDLC.deleteMany({
      where: { piaAssessment_id: piaAssessmentId }
    });

    // Check if there's any data to save
    if (req.body.stakeholderName) {
      if (Array.isArray(req.body.stakeholderName)) {
        // Multiple rows submitted
        const pdlcToInsert = req.body.stakeholderName.map((name, index) => {
          return {
            piaAssessment_id: piaAssessmentId,
            formNo: formNo,
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

    return res.redirect(`/assessment/personalinfoinventory?id=${piaAssessmentId}&saved=1`);
  } catch (error) {
    console.error('Error saving PDLC:', error);
    return res.render('assessment/pers-page', {
        title: res.locals.processDataCycle,
        activePage: 'personalinfoinventory-page',
        user: req.session.user,
        piaAssessmentId,
        pdlcData: null,
        error: 'An error occurred while saving. Please try again.',
        success: null
    });
  }
};

module.exports = {
  personalInfoInventory,
  savePersonalInfoInventory
};