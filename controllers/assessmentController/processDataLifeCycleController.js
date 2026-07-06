const prisma = require('../../store/prisma');
const path = require('path');

const processDataLifeCycle = async (req, res) => {
  res.locals.processDataCycle = 'Process Data LifeCycle';

  const piaAssessmentId = Number.parseInt(req.query.id || req.body?.piaAssessmentId || req.body?.piaAssessment_id || req.session.currentAssessmentId, 10);

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
  const piaAssessmentId = Number.parseInt(req.query.id || req.body?.piaAssessment_id || req.body?.piaAssessmentId || req.session.currentAssessmentId, 10);

  const isPrevious = req.body?.redirectTo === 'previous';

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

    const normalizeDate = (value) => {
      if (!value) return '';
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return date.toISOString().slice(0, 10);
    };

    const normalizeText = (value) => String(value || '').trim();

    const normalizePdlcRows = (rows) => {
      const normalized = rows.map((row) => {
        const collections = (row.collections || [])
          .map((entry) => {
            const collection = normalizeText(entry.collection);
            const collectionRemarks = normalizeText(entry.collectionRemarks);
            if (!collection && !collectionRemarks) return null;
            return { collection, collectionRemarks };
          })
          .filter(Boolean)
          .sort((a, b) => `${a.collection}:${a.collectionRemarks}`.localeCompare(`${b.collection}:${b.collectionRemarks}`));

        const uses = (row.uses || [])
          .map((entry) => {
            const useOfData = normalizeText(entry.useOfData);
            const process = normalizeText(entry.process);
            if (!useOfData && !process) return null;
            return { useOfData, process };
          })
          .filter(Boolean)
          .sort((a, b) => `${a.useOfData}:${a.process}`.localeCompare(`${b.useOfData}:${b.process}`));

        const sharings = (row.sharings || [])
          .map((entry) => {
            const dataSharing = normalizeText(entry.dataSharing);
            const sharedTo = normalizeText(entry.sharedTo);
            if (!dataSharing && !sharedTo) return null;
            return { dataSharing, sharedTo };
          })
          .filter(Boolean)
          .sort((a, b) => `${a.dataSharing}:${a.sharedTo}`.localeCompare(`${b.dataSharing}:${b.sharedTo}`));

        return {
          stakeholderName: normalizeText(row.stakeholderName),
          retentionPeriod: normalizeText(row.retentionPeriod),
          retentionRemarks: normalizeText(row.retentionRemarks),
          disposalMethod: normalizeText(row.disposalMethod),
          dlcDiagram: normalizeText(row.dlcDiagram),
          collections,
          uses,
          sharings
        };
      });

      return normalized
        .filter((row) => row.stakeholderName || row.retentionPeriod || row.retentionRemarks || row.disposalMethod || row.dlcDiagram || row.collections.length || row.uses.length || row.sharings.length)
        .sort((a, b) => {
          const keyA = `${a.stakeholderName}:${a.retentionPeriod}:${a.retentionRemarks}:${a.disposalMethod}:${a.dlcDiagram}`;
          const keyB = `${b.stakeholderName}:${b.retentionPeriod}:${b.retentionRemarks}:${b.disposalMethod}:${b.dlcDiagram}`;
          return keyA.localeCompare(keyB);
        });
    };

    const dlcDiagramByIndex = new Map();
    if (Array.isArray(req.files)) {
      req.files.forEach((file) => {
        const match = file.fieldname.match(/^dlcDiagram\[(\d+)\]$/);
        if (!match) return;
        const index = Number.parseInt(match[1], 10);
        if (!Number.isNaN(index)) {
          const relativePath = path.join('exports', 'dlc', file.filename).replace(/\\/g, '/');
          dlcDiagramByIndex.set(index, relativePath);
        }
      });
    }

    const stakeholderNames = normalizeIndexedArray(req.body.stakeholderName);
    const retentionPeriods = normalizeIndexedArray(req.body.retentionPeriod);
    const retentionRemarksList = normalizeIndexedArray(req.body.retentionRemarks);
    const disposalMethods = normalizeIndexedArray(req.body.disposalMethod);
    const dlcDiagramPaths = normalizeIndexedArray(req.body.dlcDiagramPath);

    const collectionsByRow = normalizeIndexedArray(req.body.collections);
    const usesByRow = normalizeIndexedArray(req.body.uses);
    const sharingsByRow = normalizeIndexedArray(req.body.sharings);

    const incomingRows = stakeholderNames
      .map((name, index) => {
        const collectionsRaw = normalizeIndexedArray(collectionsByRow[index]);
        const usesRaw = normalizeIndexedArray(usesByRow[index]);
        const sharingsRaw = normalizeIndexedArray(sharingsByRow[index]);

        const collections = collectionsRaw
          .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const collection = String(entry.collection || '').trim();
            const collectionRemarks = String(entry.collectionRemarks || '').trim();
            if (!collection && !collectionRemarks) return null;
            return { collection, collectionRemarks };
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

        const row = {
          stakeholderName: String(name || '').trim(),
          retentionPeriod: String(retentionPeriods[index] || '').trim(),
          retentionRemarks: String(retentionRemarksList[index] || '').trim(),
          disposalMethod: String(disposalMethods[index] || '').trim(),
          dlcDiagram: dlcDiagramByIndex.get(index) || String(dlcDiagramPaths[index] || '').trim() || null,
          collections,
          uses,
          sharings
        };

        const hasData = row.stakeholderName || row.retentionPeriod || row.retentionRemarks || row.disposalMethod || row.dlcDiagram || collections.length || uses.length || sharings.length;
        return hasData ? row : null;
      })
      .filter(Boolean);

    const existingPdlc = await prisma.pDLC.findMany({
      where: { piaAssessment_id: piaAssessmentId },
      include: { collections: true, uses: true, sharings: true }
    });

    const normalizedExisting = normalizePdlcRows(existingPdlc);
    const normalizedIncoming = normalizePdlcRows(incomingRows);

    const redirectTarget = isPrevious
      ? `/assessment/authorizedparties?id=${piaAssessmentId}`
      : `/assessment/personalinfoinventory?id=${piaAssessmentId}`;

    if (JSON.stringify(normalizedExisting) === JSON.stringify(normalizedIncoming)) {
      return res.redirect(redirectTarget);
    }

    // Delete dependent ThreatsAndControl records first to avoid FK violations,
    // then delete PDLC records to overwrite with new ones
    await prisma.threatsAndControl.deleteMany({ where: { piaAssessment_id: piaAssessmentId } }).catch(() => {});
    await prisma.pDLC.deleteMany({ where: { piaAssessment_id: piaAssessmentId } });

    const createOperations = incomingRows.map((row) => {
      const data = {
        piaAssessment_id: piaAssessmentId,
        stakeholderName: row.stakeholderName,
        retentionPeriod: row.retentionPeriod,
        retentionRemarks: row.retentionRemarks,
        disposalMethod: row.disposalMethod,
        dlcDiagram: row.dlcDiagram
      };

      if (row.collections.length > 0) {
        data.collections = { create: row.collections };
      }

      if (row.uses.length > 0) {
        data.uses = { create: row.uses };
      }

      if (row.sharings.length > 0) {
        data.sharings = { create: row.sharings };
      }

      return prisma.pDLC.create({ data });
    });

    if (createOperations.length > 0) {
      await prisma.$transaction(createOperations);
    }
    return res.redirect(redirectTarget);
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