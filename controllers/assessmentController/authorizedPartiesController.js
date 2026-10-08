const prisma = require('../../store/prisma');
const { assignPiaName } = require('../../services/piaNameService');

const formatDateForInput = (value) => (value ? value.toISOString().slice(0, 10) : '');
const listUnits = () => prisma.unit.findMany({
  where: { name: { not: 'n/a' } },
  orderBy: { name: 'asc' }
});

const authorizedParties = async (req, res) => {
  res.locals.authParties = 'Authorized Parties';
  
  const piaAssessmentId = Number.parseInt(req.query.id || req.body?.piaAssessmentId || req.body?.piaAssessment_id || req.session.currentAssessmentId, 10);
  const success = req.query.saved === '1' ? 'Authorized parties saved successfully!' : null;
  
  if (!piaAssessmentId) {
    return res.redirect('/assessment');
  }
  const piaAssessment_id = Number.parseInt(piaAssessmentId, 10);
  const sessionUserId = Number.parseInt(req.session.user?.id, 10);
  const currentUserQuery = Number.isInteger(sessionUserId)
    ? prisma.user.findUnique({ where: { id: sessionUserId }, select: { units: true } })
    : req.session.user?.username
      ? prisma.user.findUnique({ where: { userName: req.session.user.username }, select: { units: true } })
      : Promise.resolve(null);
  const [rawPartyData, units, currentUser] = await Promise.all([
    prisma.authorizedParties.findMany({ where: { piaAssessment_id } }),
    listUnits(),
    currentUserQuery
  ]);
  const partyDefinitions = [
    {
      honorificsField: null,
      firstNameField: 'headFirstName',
      lastNameField: 'headLastName',
      positionField: 'headPosition',
      officeField: 'headOfficeUnit',
      emailField: '',
      dateField: 'headDateSigned',
      userType: 'HEAD_OFFICE'
    },
    {
      honorificsField: null,
      firstNameField: 'compName',
      lastNameField: 'compLastName',
      positionField: 'compPosition',
      officeField: '',
      emailField: 'compEmail',
      dateField: 'compDateSigned',
      userType: 'COMPLIANCE_OFFICER'
    },
    {
      honorificsField: 'reviewHonorifics',
      firstNameField: 'reviewFirstName',
      lastNameField: 'reviewLastName',
      positionField: 'reviewPosition',
      officeField: '',
      emailField: '',
      dateField: 'reviewDateSigned',
      userType: 'REVIEWER'
    },
    {
      honorificsField: 'approveHonorifics',
      firstNameField: 'approveFirstName',
      lastNameField: 'approveLastName',
      positionField: 'approvePosition',
      officeField: '',
      emailField: '',
      dateField: 'approveDateSigned',
      userType: 'APPROVED_BY'
    }
  ];
  const formData = {};
  formData.reviewHonorifics = 'Dr.';
  formData.reviewFirstName = 'Cecilia';
  formData.reviewLastName = 'Mercado';
  formData.reviewPosition = 'Data Protection Officer';
  formData.approveHonorifics = 'Rev. Fr.';
  formData.approveFirstName = 'Gilbert';
  formData.approveLastName = 'Sales';

  partyDefinitions.forEach(({userType, honorificsField, firstNameField, lastNameField, positionField, officeField, emailField, dateField}) => {
    const party = rawPartyData.find(p => p.userType === userType);
    if (party) {
      let name = party.name.trim();
      let foundHonorific = '';
      
      if (honorificsField) {
        const honorificsOrder = ['Rev. Fr.', 'Dr.', 'Rev.', 'Fr.', 'Mr.', 'Ms.', 'Mrs.', 'Atty.', 'Engr.'];
        for (const h of honorificsOrder) {
          if (name.startsWith(h + ' ')) {
            foundHonorific = h;
            name = name.substring(h.length).trim();
            break;
          }
        }
      }
      
      const nameParts = name.split(/\s+/);
      if (honorificsField) formData[honorificsField] = foundHonorific;
      formData[firstNameField] = nameParts[0] || '';
      formData[lastNameField] = nameParts.slice(1).join(' ') || '';
      formData[positionField] = party.position || '';
      if (officeField) formData[officeField] = party.officeUnit || '';
      if (emailField) formData[emailField] = party.email || '';
      formData[dateField] = formatDateForInput(party.dateSigned);
    }
  });
  if (!formData.headOfficeUnit && currentUser?.units && currentUser.units !== 'n/a') {
    formData.headOfficeUnit = currentUser.units;
  }

  return res.render('assessment/authorizedparties-page', {
    title: res.locals.authParties,
    activePage: 'authorizedparties-page',
    user: req.session.user,
    piaAssessmentId,
    units,
    authorizedPartiesData: formData,
    error: null,
    success
  });
};

const saveAuthorizedParties = async (req, res) => {
  try {
    const body = req.body || {};
    const getFieldValue = (value) => (Array.isArray(value) ? value[0] : value || '');
    const piaAssessment_id = Number.parseInt(body.piaAssessment_id || body.piaAssessmentId || req.session.currentAssessmentId, 10);

    const isPrevious = body.redirectTo === 'previous';

    if (!Number.isInteger(piaAssessment_id)) {
      return res.render('assessment/authorizedparties-page', {
        title: 'Authorized Parties',
        piaAssessmentId: req.session.currentAssessmentId,
        activePage: 'authorizedparties-page',
        user: req.session.user,
        units: await listUnits(),
        error: 'Assessment ID is required.',
        success: null
      });
    }

    const partyDefinitions = [
      {
        honorificsField: null,
        firstNameField: 'headFirstName',
        lastNameField: 'headLastName',
        positionField: 'headPosition',
        officeField: 'headOfficeUnit',
        emailField: '',
        dateField: 'headDateSigned',
        userType: 'HEAD_OFFICE'
      },
      {
        honorificsField: null,
        firstNameField: 'compName',
        lastNameField: 'compLastName',
        positionField: 'compPosition',
        officeField: '',
        emailField: 'compEmail',
        dateField: 'compDateSigned',
        userType: 'COMPLIANCE_OFFICER'
      },
      {
        honorificsField: 'reviewHonorifics',
        firstNameField: 'reviewFirstName',
        lastNameField: 'reviewLastName',
        positionField: 'reviewPosition',
        officeField: '',
        emailField: '',
        dateField: 'reviewDateSigned',
        userType: 'REVIEWER'
      },
      {
        honorificsField: 'approveHonorifics',
        firstNameField: 'approveFirstName',
        lastNameField: 'approveLastName',
        positionField: 'approvePosition',
        officeField: '',
        emailField: '',
        dateField: 'approveDateSigned',
        userType: 'APPROVED_BY'
      }
    ];

    const partyData = partyDefinitions
      .filter(({ firstNameField, positionField }) => body[firstNameField] || body[positionField])
      .map(({ honorificsField, firstNameField, lastNameField, positionField, officeField, emailField, dateField, userType }) => {
        const h = honorificsField ? getFieldValue(body[honorificsField]) : '';
        const f = getFieldValue(body[firstNameField]);
        const l = getFieldValue(body[lastNameField]);
        
        return {
          piaAssessment_id,
          name: `${h} ${f} ${l}`.replace(/\s+/g, ' ').trim(),
          position: getFieldValue(body[positionField]),
          officeUnit: getFieldValue(body[officeField]),
          email: getFieldValue(body[emailField]),
          userType,
          dateSigned: body[dateField] ? new Date(body[dateField]) : null
        };
      });

    const selectedOfficeUnit = String(getFieldValue(body.headOfficeUnit)).trim();
    const initialOfficeUnit = String(getFieldValue(body.initialHeadOfficeUnit)).trim();
    const officeUnitChanged = selectedOfficeUnit && selectedOfficeUnit !== initialOfficeUnit;
    const hasHeadOfficeParty = partyData.some(party => party.userType === 'HEAD_OFFICE');
    if (selectedOfficeUnit) {
      const availableUnit = await prisma.unit.findUnique({ where: { name: selectedOfficeUnit } });
      if (!availableUnit) {
        return res.render('assessment/authorizedparties-page', {
          title: 'Authorized Parties',
          piaAssessmentId: piaAssessment_id,
          activePage: 'authorizedparties-page',
          user: req.session.user,
          units: await listUnits(),
          error: 'Select an available unit or add it first.',
          success: null,
          authorizedPartiesData: body
        });
      }
    }

    if (!partyData.length && !isPrevious) {
      return res.render('assessment/authorizedparties-page', {
        title: 'Authorized Parties',
        piaAssessmentId: body.piaAssessment_id,
        activePage: 'authorizedparties-page',
        user: req.session.user,
        units: await listUnits(),
        error: 'Please complete at least one authorized party section.',
        success: null,
        authorizedPartiesData: {}
      });
    }

    if (partyData.length > 0) {
      const sessionUser = req.session.user || {};
      const sessionUserId = Number.parseInt(sessionUser.id, 10);
      const userWhere = Number.isInteger(sessionUserId)
        ? { id: sessionUserId }
        : sessionUser.username
          ? { userName: sessionUser.username }
          : null;

      const shouldSyncAccountUnit = officeUnitChanged && hasHeadOfficeParty && userWhere;
      const shouldReassignPiaName = officeUnitChanged && hasHeadOfficeParty;

      await prisma.$transaction(async (transaction) => {
        await transaction.authorizedParties.deleteMany({ where: { piaAssessment_id } });
        for (const data of partyData) {
          await transaction.authorizedParties.create({ data });
        }
        if (shouldSyncAccountUnit) {
          await transaction.user.update({ where: userWhere, data: { units: selectedOfficeUnit } });
        }
        if (shouldReassignPiaName) {
          await assignPiaName(transaction, piaAssessment_id, selectedOfficeUnit);
        }
      });

      if (shouldSyncAccountUnit && req.session.user) {
        req.session.user.units = selectedOfficeUnit;
      }
    }

    req.session.currentAssessmentId = piaAssessment_id;
    const redirectTarget = isPrevious 
      ? `/assessment?id=${piaAssessment_id}` 
      : `/assessment/processdatalifecycle?id=${piaAssessment_id}`;
    return res.redirect(redirectTarget);
  } catch (error) {
    console.error('Error saving authorized parties:', error);
    return res.render('assessment/authorizedparties-page', {
      title: 'Authorized Parties',
      piaAssessmentId: req.body?.piaAssessment_id || req.session.currentAssessmentId,
      activePage: 'authorizedparties-page',
      user: req.session.user,
      units: await listUnits().catch(() => []),
      error: 'Failed to save authorized parties.',
      success: null
    });
  }
};

const createUnit = async (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name || name.length > 255) {
    return res.status(400).json({ error: 'Enter a unit name of 1 to 255 characters.' });
  }

  try {
    const unit = await prisma.unit.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    return res.status(200).json({ unit: { name: unit.name } });
  } catch (error) {
    console.error('Error creating unit:', error);
    return res.status(500).json({ error: 'Unable to save this unit right now.' });
  }
};

module.exports = {
  authorizedParties,
	saveAuthorizedParties,
  createUnit
};
