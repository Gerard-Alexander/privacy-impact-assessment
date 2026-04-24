const prisma = require('../../store/prisma');

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
  const processBasis = Array.isArray(pii.processBasis) ? pii.processBasis[0] : null;

  return {
    ...pii,
    dataProcessingValue: pii.dataProcessing || '',
    processingTypeValue: processBasis?.processingType || '',
    basisNumValue: processBasis?.basisNum || '',
    dataSubjectTypeId: pii.dataSubjectsType_id || '',
    dataSubjectTypeLabel: pii.DataSubjectType?.dataSubjectType || '',
    dataSubjectId: pii.dataSubject_id || '',
    dataSubjectName: pii.dataSubject?.name || '',
    dataSubjectEmail: pii.dataSubject?.email || '',
    dataSubjectPhone: pii.dataSubject?.mobileNumber || '',
    purposeOfProcessing: pii.purposeOfProcessing || '',
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

    const [existingPii, dataSubjectTypes] = await Promise.all([
      prisma.pII.findMany({
        where: { piaAssessment_id: parseInt(piiAssessmentId, 10) },
        include: {
          DataSubjectType: true,
          dataSubject: true,
          processBasis: true
        }
      }),
      prisma.dataSubjectTypes.findMany({
        orderBy: { id: 'asc' }
      })
    ]);

    const mappedPii = existingPii.map(formatPiiForForm);

    return res.render('assessment/personalinfoinventory-page', {
      title: res.locals.personalInfoInventory,
      activePage: 'personalinfoinventory-page',
      user: req.session.user,
      piaAssessmentId: piiAssessmentId,
      piiAssessmentId,
      piiData: mappedPii.length > 0 ? mappedPii : null,
      pdlcData: mappedPii.length > 0 ? mappedPii : null,
      dataSubjectTypes,
      error: null,
      success: req.query.saved === '1' ? 'Personal information inventory saved successfully!' : null
    });
  } catch (error) {
    console.error('Error fetching PII data:', error);
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

    await ensureDataSubjectTypes();

    const formNames = toArray(req.body.formName);
    const formNos = toArray(req.body.formNo);
    const dataProcessingValues = toArray(req.body.dataProcessing);
    const dataSubjectTypeIds = toArray(req.body.dataSubjectTypeId);
    const dataSubjectNames = toArray(req.body.dataSubjectName);
    const dataSubjectEmails = toArray(req.body.dataSubjectEmail);
    const dataSubjectPhones = toArray(req.body.dataSubjectPhone);
    const recipientsUsers = toArray(req.body.recipientsUsers);
    const processingTypes = toArray(req.body.processingType);
    const basisNums = toArray(req.body.basisNum);
    const purposes = toArray(req.body.purposeOfProcessing);

    const rowCount = Math.max(
      formNames.length,
      formNos.length,
      dataProcessingValues.length,
      dataSubjectTypeIds.length,
      dataSubjectNames.length,
      dataSubjectEmails.length,
      dataSubjectPhones.length,
      recipientsUsers.length,
      processingTypes.length,
      basisNums.length,
      purposes.length
    );

    if (!rowCount) {
      return res.redirect(`/assessment/personalinfoinventory?id=${piaAssessmentId}`);
    }

    const validatedRows = [];

    for (let index = 0; index < rowCount; index += 1) {
      const formName = formNames[index] || '';
      const formNo = Number.parseInt(formNos[index] || '', 10);
      const dataProcessing = dataProcessingValues[index] || '';
      const dataSubjectTypeId = Number.parseInt(dataSubjectTypeIds[index] || '', 10);
      const dataSubjectName = dataSubjectNames[index] || '';
      const dataSubjectEmail = dataSubjectEmails[index] || '';
      const dataSubjectPhone = dataSubjectPhones[index] || '';
      const recipientsUser = recipientsUsers[index] || '';
      const processingType = processingTypes[index] || '';
      const basisNum = basisNums[index] || '';
      const purposeOfProcessing = purposes[index] || '';

      if (!Number.isInteger(formNo) || !Number.isInteger(dataSubjectTypeId) || !formName || !dataSubjectName || !dataSubjectEmail || !dataSubjectPhone || !recipientsUser || !dataProcessing || !processingType || !basisNum || !purposeOfProcessing) {
        const dataSubjectTypes = await prisma.dataSubjectTypes.findMany({
          orderBy: { id: 'asc' }
        });

        return res.render('assessment/personalinfoinventory-page', {
          title: res.locals.personalInfoInventory,
          activePage: 'personalinfoinventory-page',
          user: req.session.user,
          piaAssessmentId,
          piiData: null,
          pdlcData: null,
          dataSubjectTypes,
          error: 'Please complete every Personal Information Inventory row before continuing.',
          success: null
        });
      }

      validatedRows.push({
        formNo,
        formName,
        dataProcessing,
        dataSubjectTypeId,
        dataSubjectName,
        dataSubjectEmail,
        dataSubjectPhone,
        recipientsUser,
        processingType,
        basisNum,
        purposeOfProcessing
      });
    }

    const existingPii = await prisma.pII.findMany({
      where: { piaAssessment_id: piaAssessmentId },
      select: { dataSubject_id: true }
    });

    await prisma.pII.deleteMany({
      where: { piaAssessment_id: piaAssessmentId }
    });

    const dataSubjectIdsToDelete = existingPii
      .map((record) => record.dataSubject_id)
      .filter((id) => Number.isInteger(id));

    if (dataSubjectIdsToDelete.length > 0) {
      await prisma.dataSubjectInfo.deleteMany({
        where: { id: { in: dataSubjectIdsToDelete } }
      });
    }

    for (const row of validatedRows) {
      const createdDataSubject = await prisma.dataSubjectInfo.create({
        data: {
          name: row.dataSubjectName,
          email: row.dataSubjectEmail,
          mobileNumber: row.dataSubjectPhone
        }
      });

      const createdPii = await prisma.pII.create({
        data: {
          piaAssessment_id: piaAssessmentId,
          formNo: row.formNo,
          formName: row.formName,
          dataProcessing: row.dataProcessing,
          dataSubjectsType_id: row.dataSubjectTypeId,
          dataSubject_id: createdDataSubject.id,
          recipientsUsers: row.recipientsUser,
          purposeOfProcessing: row.purposeOfProcessing
        }
      });

      await prisma.processingBasis.create({
        data: {
          pii_ID: createdPii.id,
          processingType: row.processingType,
          basisNum: row.basisNum
        }
      });
    }

    return res.redirect(`/assessment/personalinfoinventory?id=${piaAssessmentId}&saved=1`);
  } catch (error) {
    console.error('Error saving PII:', error);
    const dataSubjectTypes = await prisma.dataSubjectTypes.findMany({
      orderBy: { id: 'asc' }
    }).catch(() => []);

    return res.render('assessment/personalinfoinventory-page', {
        title: res.locals.personalInfoInventory,
        activePage: 'personalinfoinventory-page',
        user: req.session.user,
        piaAssessmentId,
        piiData: null,
        pdlcData: null,
        dataSubjectTypes,
        error: 'An error occurred while saving. Please try again.',
        success: null
    });
  }
};

module.exports = {
  personalInfoInventory,
  savePersonalInfoInventory
};