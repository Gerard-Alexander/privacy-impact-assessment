const prisma = require('../../store/prisma');

const formatDateForInput = (value) => (value ? value.toISOString().slice(0, 10) : '');

const authorizedParties = async (req, res) => {
  res.locals.authParties = 'Authorized Parties';
  
  const piaAssessmentId = req.query.id || req.session.currentAssessmentId;
  const success = req.query.saved === '1' ? 'Authorized parties saved successfully!' : null;
  
  if (!piaAssessmentId) {
    return res.redirect('/assessment');
  }
  const piaAssessment_id = Number.parseInt(piaAssessmentId, 10);
  const rawPartyData = await prisma.authorizedParties.findMany({ where: { piaAssessment_id } });
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
  return res.render('assessment/authorizedparties-page', {
    title: res.locals.authParties,
    activePage: 'authorizedparties-page',
    user: req.session.user,
    piaAssessmentId,
    authorizedPartiesData: formData,
    error: null,
    success
  });
};

const saveAuthorizedParties = async (req, res) => {
  try {
    const body = req.body || {};
    const getFieldValue = (value) => (Array.isArray(value) ? value[0] : value || '');
    const piaAssessment_id = Number.parseInt(body.piaAssessment_id, 10);

    const isPrevious = body.redirectTo === 'previous';

    if (!Number.isInteger(piaAssessment_id)) {
      return res.render('assessment/authorizedparties-page', {
        title: 'Authorized Parties',
        piaAssessmentId: req.session.currentAssessmentId,
        activePage: 'authorizedparties-page',
        user: req.session.user,
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

    if (!partyData.length && !isPrevious) {
      return res.render('assessment/authorizedparties-page', {
        title: 'Authorized Parties',
        piaAssessmentId: body.piaAssessment_id,
        activePage: 'authorizedparties-page',
        user: req.session.user,
        error: 'Please complete at least one authorized party section.',
        success: null,
        authorizedPartiesData: {}
      });
    }

    if (partyData.length > 0) {
      await prisma.$transaction([
        prisma.authorizedParties.deleteMany({ where: { piaAssessment_id } }),
        ...partyData.map((data) => prisma.authorizedParties.create({ data }))
      ]);
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
      error: 'Failed to save authorized parties.',
      success: null
    });
  }
};

module.exports = {
  authorizedParties,
	saveAuthorizedParties
};
