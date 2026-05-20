const prisma = require('../../store/prisma');
const path = require('path');

const processDataLifeCycle = async (req, res) => {
  res.locals.processDataCycle = 'Process Data LifeCycle';

  const piaAssessmentId = req.query.id || req.session.currentAssessmentId;

  if (!piaAssessmentId) {
    return res.redirect('/assessment');
  }

  try {
    const existingPdlc = await prisma.pDLC.findMany({
      where: { piaAssessment_id: parseInt(piaAssessmentId, 10) },
      include: {
        collections: true,
        uses: true,
        sharings: true
      }
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

    const normalizeIndexedArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'object') {
        return Object.keys(value)
          .sort((a, b) => Number(a) - Number(b))
          .map((key) => value[key]);
      }
      return [value];
    };

    const parseDateValue = (value) => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    // Delete dependent ThreatsAndControl records first to avoid FK violations,
    // then delete PDLC records to overwrite with new ones
    await prisma.threatsAndControl.deleteMany({ where: { piaAssessment_id: piaAssessmentId } }).catch(() => {});
    await prisma.pDLC.deleteMany({ where: { piaAssessment_id: piaAssessmentId } });

    const dlcDiagramByIndex = new Map();
    if (Array.isArray(req.files)) {
      req.files.forEach((file) => {
        const match = file.fieldname.match(/^dlcDiagram\[(\d+)\]$/);
        if (!match) return;
        const index = Number.parseInt(match[1], 10);
        if (!Number.isNaN(index)) {
          const relativePath = path.join('uploads', 'dlc', file.filename).replace(/\\/g, '/');
          dlcDiagramByIndex.set(index, relativePath);
        }
      });
    }

    // Check if there's any data to save
    if (req.body.stakeholderName) {
      const stakeholderNames = normalizeIndexedArray(req.body.stakeholderName);
      const retentionPeriods = normalizeIndexedArray(req.body.retentionPeriod);
      const retentionDates = normalizeIndexedArray(req.body.retentionDate);
      const disposalMethods = normalizeIndexedArray(req.body.disposalMethod);
      const dlcDiagramPaths = normalizeIndexedArray(req.body.dlcDiagramPath);

      const collectionsByRow = normalizeIndexedArray(req.body.collections);
      const usesByRow = normalizeIndexedArray(req.body.uses);
      const sharingsByRow = normalizeIndexedArray(req.body.sharings);

      const createOperations = stakeholderNames.map((name, index) => {
        const collectionsRaw = normalizeIndexedArray(collectionsByRow[index]);
        const usesRaw = normalizeIndexedArray(usesByRow[index]);
        const sharingsRaw = normalizeIndexedArray(sharingsByRow[index]);

        const collections = collectionsRaw
          .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const collection = String(entry.collection || '').trim();
            const dateCollected = parseDateValue(entry.dateCollected);
            if (!collection && !dateCollected) return null;
            return { collection, dateCollected };
          })
          .filter(Boolean);

        const uses = usesRaw
          .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const useOfData = String(entry.useOfData || '').trim();
            const process = String(entry.process || '').trim();
            if (!useOfData && !process) return null;
            return { useOfData, process };
          })
          .filter(Boolean);

        const sharings = sharingsRaw
          .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const dataSharing = String(entry.dataSharing || '').trim();
            const sharedTo = String(entry.sharedTo || '').trim();
            if (!dataSharing && !sharedTo) return null;
            return { dataSharing, sharedTo };
          })
          .filter(Boolean);

        const data = {
          piaAssessment_id: piaAssessmentId,
          stakeholderName: String(name || '').trim(),
          retentionPeriod: String(retentionPeriods[index] || '').trim(),
          retentionDate: parseDateValue(retentionDates[index]),
          disposalMethod: String(disposalMethods[index] || '').trim(),
          dlcDiagram: dlcDiagramByIndex.get(index) || String(dlcDiagramPaths[index] || '').trim() || null
        };

        if (collections.length > 0) {
          data.collections = { create: collections };
        }

        if (uses.length > 0) {
          data.uses = { create: uses };
        }

        if (sharings.length > 0) {
          data.sharings = { create: sharings };
        }

        return prisma.pDLC.create({ data });
      });

      if (createOperations.length > 0) {
        await prisma.$transaction(createOperations);
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