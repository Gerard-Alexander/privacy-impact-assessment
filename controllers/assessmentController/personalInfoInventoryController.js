const path = require('path');
const prisma = require('../../store/prisma');
const { piiUpload } = require('../uploadController/uploadController');

const DATA_SUBJECT_TYPE_VALUES = ['EMPLOYEES', 'CUSTOMERS', 'CLIENTS', 'SUPPLIERS'];

const ensureDataSubjectTypes = async () => {
  const existingTypes = await prisma.dataSubjectTypes.findMany({
    select: { dataSubjectType: true }
  });

  const existingValues = new Set(existingTypes.map((type) => type.dataSubjectType));
  const missingValues = DATA_SUBJECT_TYPE_VALUES.filter((value) => !existingValues.has(value));

  if (missingValues.length > 0) {
    await prisma.dataSubjectTypes.createMany({
      data: missingValues.map((value) => ({ dataSubjectType: value }))
    });
  }
};

const formatPiiForForm = (pii) => {
  const dataSubjects = Array.isArray(pii.piiDatasubjects) ? pii.piiDatasubjects : [];
  const recipients = Array.isArray(pii.recipientUsers) ? pii.recipientUsers : [];

  return {
    ...pii,
    dataProcessingValue: pii.dataProcessing || '',
    piProcessBasisId: pii.piProcessBasis_id || '',
    spiProcessBasisId: pii.spiProcessBasis_id || '',
    dataFormImagePath: pii.dataFormImagePath || '',
    dataFormImageUploadedAt: pii.dataFormImageUploadedAt || null,
    dataSubjects: dataSubjects.map((subject) => ({
      dataSubjectsType_id: subject.dataSubjectsType_id,
      dataSubjectTypeLabel: subject.dataSubjectType?.dataSubjectType || '',
      name: subject.name || ''
    })),
    recipients: recipients.map((recipient) => ({
      recipientName: recipient.recipientName || ''
    })),
    dataSharing: '',
    sharedTo: '',
    disposalMethod: '',
    dateCollected: ''
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

const personalInfoInventory = async (req, res) => {
  res.locals.personalInfoInventory = 'Personal Information Inventory';

  const piiAssessmentId = req.query.id || req.session.currentAssessmentId;

  if (!piiAssessmentId) {
    return res.redirect('/assessment');
  }

  try {
    await ensureDataSubjectTypes();

    const [existingPii, dataSubjectTypes, processingBasis] = await Promise.all([
      prisma.pII.findMany({
        where: { piaAssessment_id: parseInt(piiAssessmentId, 10) },
        include: {
          piProcessBasis: true,
          spiProcessBasis: true,
          piiDatasubjects: {
            include: {
              dataSubjectType: true
            }
          },
          recipientUsers: true
        }
      }),
      prisma.dataSubjectTypes.findMany({
        orderBy: { id: 'asc' }
      }),
      prisma.processingBasis.findMany({
        orderBy: [{ processingType: 'asc' }, { basisNum: 'asc' }]
      })
    ]);

    const mappedPii = existingPii.map(formatPiiForForm);
    const piProcessingBasisOptions = processingBasis.filter((basis) => ['PI', 'BOTH'].includes(basis.processingType));
    const spiProcessingBasisOptions = processingBasis.filter((basis) => ['SPI', 'BOTH'].includes(basis.processingType));

    return res.render('assessment/personalinfoinventory-page', {
      title: res.locals.personalInfoInventory,
      activePage: 'personalinfoinventory-page',
      user: req.session.user,
      piaAssessmentId: piiAssessmentId,
      piiAssessmentId,
      piiData: mappedPii.length > 0 ? mappedPii : null,
      pdlcData: mappedPii.length > 0 ? mappedPii : null,
      dataSubjectTypes,
      piProcessingBasisOptions,
      spiProcessingBasisOptions,
      error: null,
      success: req.query.saved === '1' ? 'Personal information inventory saved successfully!' : null
    });
  } catch (error) {
    console.error('Error fetching PII data:', error);
    return res.redirect('/assessment');
  }
};

const savePersonalInfoInventory = async (req, res) => {
  let piaAssessmentId;

  try {
    await new Promise((resolve, reject) => {
      piiUpload.any()(req, res, (err) => {
        if (err) return reject(err);
        return resolve();
      });
    });

    piaAssessmentId = Number.parseInt(req.body?.piaAssessment_id || req.session.currentAssessmentId, 10);

    const isPrevious = req.body?.redirectTo === 'previous';

    if (!Number.isInteger(piaAssessmentId)) {
      return res.redirect('/assessment');
    }

    req.session.currentAssessmentId = piaAssessmentId;

    await ensureDataSubjectTypes();

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

    const formNames = normalizeIndexedArray(req.body.formName);
    const formNos = normalizeIndexedArray(req.body.formNo);
    const dataProcessingValues = normalizeIndexedArray(req.body.dataProcessing);
    const recipientsByRow = normalizeIndexedArray(req.body.recipients);
    const dataSubjectsByRow = normalizeIndexedArray(req.body.dataSubjects);
    const piProcessBasisIds = normalizeIndexedArray(req.body.piProcessBasisId);
    const spiProcessBasisIds = normalizeIndexedArray(req.body.spiProcessBasisId);
    const dataFormImagePaths = normalizeIndexedArray(req.body.dataFormImagePath);
    const dataFormImageUploadedAtValues = normalizeIndexedArray(req.body.dataFormImageUploadedAt);

    const dataFormImageByIndex = new Map();
    if (Array.isArray(req.files)) {
      req.files.forEach((file) => {
        const match = file.fieldname.match(/^dataFormImage\[(\d+)\]$/);
        if (!match) return;
        const index = Number.parseInt(match[1], 10);
        if (!Number.isNaN(index)) {
          const relativePath = path.join('uploads', 'pii', file.filename).replace(/\\/g, '/');
          dataFormImageByIndex.set(index, relativePath);
        }
      });
    }

    const defaultDataSubjectType = await prisma.dataSubjectTypes.findFirst({
      orderBy: { id: 'asc' },
      select: { id: true }
    });

    const [defaultPiBasis, defaultSpiBasis] = await Promise.all([
      prisma.processingBasis.findFirst({
        where: { processingType: { in: ['PI', 'BOTH'] } },
        orderBy: [{ processingType: 'asc' }, { basisNum: 'asc' }],
        select: { id: true }
      }),
      prisma.processingBasis.findFirst({
        where: { processingType: { in: ['SPI', 'BOTH'] } },
        orderBy: [{ processingType: 'asc' }, { basisNum: 'asc' }],
        select: { id: true }
      })
    ]);

    const rowCount = Math.max(
      formNames.length,
      formNos.length,
      dataProcessingValues.length,
      recipientsByRow.length,
      dataSubjectsByRow.length,
      piProcessBasisIds.length,
      spiProcessBasisIds.length,
      dataFormImagePaths.length,
      dataFormImageByIndex.size
    );

    if (!rowCount) {
      return res.redirect(`/assessment/personalinfoinventory?id=${piaAssessmentId}`);
    }

    const validatedRows = [];
    const submittedRows = [];
    const defaultDataSubjectTypeId = defaultDataSubjectType?.id || 1;

    for (let index = 0; index < rowCount; index += 1) {
      const formName = formNames[index] || '';
      let formNo = Number.parseInt(formNos[index] || '', 10);
      if (Number.isNaN(formNo)) formNo = 0;
      const dataProcessing = dataProcessingValues[index] || '';
      const piProcessBasisId = Number.parseInt(piProcessBasisIds[index] || '', 10);
      const spiProcessBasisId = Number.parseInt(spiProcessBasisIds[index] || '', 10);
      const uploadedImagePath = dataFormImageByIndex.get(index) || '';
      const existingImagePath = dataFormImagePaths[index] || '';
      const dataFormImagePath = uploadedImagePath || existingImagePath || '';
      let parsedUploadedAt = null;
      if (!uploadedImagePath && dataFormImageUploadedAtValues[index]) {
        const candidate = new Date(dataFormImageUploadedAtValues[index]);
        if (!Number.isNaN(candidate.getTime())) {
          parsedUploadedAt = candidate;
        }
      }
      const dataFormImageUploadedAt = uploadedImagePath ? new Date() : parsedUploadedAt;

      const recipientsRaw = normalizeIndexedArray(recipientsByRow[index]);
      const dataSubjectsRaw = normalizeIndexedArray(dataSubjectsByRow[index]);

      const recipients = recipientsRaw
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null;
          const recipientName = String(entry.recipientName || '').trim();
          if (!recipientName) return null;
          return { recipientName };
        })
        .filter(Boolean);

      const dataSubjects = dataSubjectsRaw
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null;
          const name = String(entry.name || '').trim();
          const dataSubjectsTypeId = Number.parseInt(entry.dataSubjectsTypeId || '', 10);
          if (!name) return null;
          return {
            name,
            dataSubjectsType_id: Number.isInteger(dataSubjectsTypeId) ? dataSubjectsTypeId : defaultDataSubjectTypeId
          };
        })
        .filter(Boolean);

      const hasImageInput = Boolean(dataFormImagePath);
      const normalizedRow = {
        formNo: formNo,
        formName: formName,
        dataProcessing: dataProcessing || (hasImageInput ? 'BOTH' : ''),
        dataFormImagePath: dataFormImagePath || null,
        dataFormImageUploadedAt: dataFormImageUploadedAt,
        recipients,
        dataSubjects,
        piProcessBasisId: Number.isInteger(piProcessBasisId)
          ? piProcessBasisId
          : (hasImageInput ? (defaultPiBasis?.id || null) : null),
        spiProcessBasisId: Number.isInteger(spiProcessBasisId)
          ? spiProcessBasisId
          : (hasImageInput ? (defaultSpiBasis?.id || null) : null)
      };

      // Store submitted row for re-rendering if validation fails
      submittedRows.push({
        formNo: formNos[index] || '',
        formName,
        dataProcessingValue: dataProcessing,
        piProcessBasisId: piProcessBasisId || '',
        spiProcessBasisId: spiProcessBasisId || '',
        dataFormImagePath: dataFormImagePath || '',
        dataFormImageUploadedAt: dataFormImageUploadedAt,
        dataSubjects: dataSubjects,
        recipients: recipients
      });

      validatedRows.push({
        formNo: normalizedRow.formNo,
        formName: normalizedRow.formName,
        dataProcessing: normalizedRow.dataProcessing,
        dataFormImagePath: normalizedRow.dataFormImagePath,
        dataFormImageUploadedAt: normalizedRow.dataFormImageUploadedAt,
        dataSubjects: normalizedRow.dataSubjects,
        recipients: normalizedRow.recipients,
        piProcessBasisId: normalizedRow.piProcessBasisId,
        spiProcessBasisId: normalizedRow.spiProcessBasisId
      });
    }

    const normalizeRows = (rows) => {
      const normalized = rows.map((row) => {
        const dataSubjects = (row.dataSubjects || row.piiDatasubjects || [])
          .map((subject) => ({
            name: String(subject.name || '').trim(),
            dataSubjectsType_id: Number.parseInt(subject.dataSubjectsType_id || subject.dataSubjectsType?.id || '', 10) || null
          }))
          .filter((subject) => subject.name)
          .sort((a, b) => `${a.dataSubjectsType_id || 0}:${a.name}`.localeCompare(`${b.dataSubjectsType_id || 0}:${b.name}`));

        const recipients = (row.recipients || row.recipientUsers || [])
          .map((recipient) => ({
            recipientName: String(recipient.recipientName || '').trim()
          }))
          .filter((recipient) => recipient.recipientName)
          .sort((a, b) => a.recipientName.localeCompare(b.recipientName));

        return {
          formNo: Number.parseInt(row.formNo || '', 10) || 0,
          formName: String(row.formName || '').trim(),
          dataProcessing: row.dataProcessing || '',
          piProcessBasisId: Number.parseInt(row.piProcessBasisId || row.piProcessBasis_id || '', 10) || null,
          spiProcessBasisId: Number.parseInt(row.spiProcessBasisId || row.spiProcessBasis_id || '', 10) || null,
          dataFormImagePath: row.dataFormImagePath || null,
          dataSubjects,
          recipients
        };
      });

      return normalized.sort((a, b) => {
        const keyA = `${a.formNo}:${a.formName}`;
        const keyB = `${b.formNo}:${b.formName}`;
        return keyA.localeCompare(keyB);
      });
    };

    const existingPii = await prisma.pII.findMany({
      where: { piaAssessment_id: piaAssessmentId },
      include: {
        piiDatasubjects: true,
        recipientUsers: true
      }
    });

    const normalizedExisting = normalizeRows(existingPii);
    const normalizedIncoming = normalizeRows(validatedRows);

    if (JSON.stringify(normalizedExisting) === JSON.stringify(normalizedIncoming)) {
      const redirectTarget = isPrevious
        ? `/assessment/processdatalifecycle?id=${piaAssessmentId}`
        : `/assessment/threatsandcontrols?id=${piaAssessmentId}`;
      return res.redirect(redirectTarget);
    }

    // Delete dependent ThreatsAndControl records first to avoid FK violations
    await prisma.threatsAndControl.deleteMany({ where: { piaAssessment_id: piaAssessmentId } }).catch(() => {});

    await prisma.pII.deleteMany({
      where: { piaAssessment_id: piaAssessmentId }
    });

    for (const row of validatedRows) {
      const createdPii = await prisma.pII.create({
        data: {
          piaAssessment_id: piaAssessmentId,
          formNo: row.formNo,
          formName: row.formName,
          dataProcessing: row.dataProcessing,
          piProcessBasis_id: row.piProcessBasisId,
          spiProcessBasis_id: row.spiProcessBasisId,
          dataFormImagePath: row.dataFormImagePath,
          dataFormImageUploadedAt: row.dataFormImageUploadedAt
        }
      });

      if (row.dataSubjects.length > 0) {
        await prisma.piiDatasubject.createMany({
          data: row.dataSubjects.map((subject) => ({
            pii_id: createdPii.id,
            dataSubjectsType_id: subject.dataSubjectsType_id,
            name: subject.name
          }))
        });
      }

      if (row.recipients.length > 0) {
        await prisma.recipientUser.createMany({
          data: row.recipients.map((recipient) => ({
            pii_id: createdPii.id,
            recipientName: recipient.recipientName
          }))
        });
      }
    }

    const redirectTarget = isPrevious
      ? `/assessment/processdatalifecycle?id=${piaAssessmentId}`
      : `/assessment/threatsandcontrols?id=${piaAssessmentId}`;
    return res.redirect(redirectTarget);
  } catch (error) {
    console.error('Error saving PII:', error);
    const dataSubjectTypes = await prisma.dataSubjectTypes.findMany({
      orderBy: { id: 'asc' }
    }).catch(() => []);

    const processingBasis = await prisma.processingBasis.findMany({
      orderBy: [{ processingType: 'asc' }, { basisNum: 'asc' }]
    }).catch(() => []);

    const piProcessingBasisOptions = processingBasis.filter((basis) => ['PI', 'BOTH'].includes(basis.processingType));
    const spiProcessingBasisOptions = processingBasis.filter((basis) => ['SPI', 'BOTH'].includes(basis.processingType));

    return res.render('assessment/personalinfoinventory-page', {
      title: res.locals.personalInfoInventory,
      activePage: 'personalinfoinventory-page',
      user: req.session.user,
      piaAssessmentId,
      piiData: null,
      pdlcData: null,
      dataSubjectTypes,
      piProcessingBasisOptions,
      spiProcessingBasisOptions,
      error: 'An error occurred while saving. Please try again.',
      success: null
    });
  }
};

module.exports = {
  personalInfoInventory,
  savePersonalInfoInventory
};