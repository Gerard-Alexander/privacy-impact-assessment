const path = require('path');
const ExcelJS = require('exceljs');
const prisma = require('../../store/prisma');

const sanitizeFileName = (value) => {
	if (!value) return 'assessment';
	return String(value).replace(/[^a-z0-9-_]+/gi, '_').slice(0, 80);
};

const addSheet = (workbook, name, headers, rows) => {
	const safeName = name.length > 31 ? name.slice(0, 31) : name;
	let sheet = workbook.getWorksheet(safeName);
	if (!sheet) {
		sheet = workbook.addWorksheet(safeName);
	}

	sheet.addRow(headers);
	rows.forEach((row) => sheet.addRow(row));

	sheet.getRow(1).font = { bold: true };
	sheet.columns.forEach((col) => {
		let maxLength = 10;
		col.eachCell({ includeEmpty: true }, (cell) => {
			const cellValue = cell.value ? String(cell.value) : '';
			maxLength = Math.max(maxLength, cellValue.length + 2);
		});
		col.width = Math.min(maxLength, 50);
	});
};

const exportAssessmentExcel = async (req, res) => {
	try {
		const assessmentId = Number.parseInt(req.query.id, 10);
		if (!Number.isInteger(assessmentId)) {
			return res.status(400).send('Invalid assessment id.');
		}

		const assessment = await prisma.piaAssessment.findUnique({
			where: { id: assessmentId },
			include: {
				authorizedParties: true,
				pdlc: {
					include: {
						collections: true,
						uses: true,
						sharings: true
					}
				},
				pii: {
					include: {
						piProcessBasis: true,
						spiProcessBasis: true,
						piiDatasubjects: { include: { dataSubjectType: true } },
						recipientUsers: true
					}
				},
				threatsAndControls: {
					include: {
						dataSubjects: { include: { dataSubjectType: true } },
						pdlc: true
					}
				},
				securityMeasures: true
			}
		});

		if (!assessment) {
			return res.status(404).send('Assessment not found.');
		}

		const templatePath = path.join(
			__dirname,
			'..',
			'..',
			'exports',
			'formats',
			'DPO-PIA_Format.xlsx'
		);

		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.readFile(templatePath);
		const sheet = workbook.getWorksheet(1); // Template has only 1 sheet named "Maintenance Log" (or something weird)

		// 1. Basic Info
		sheet.getCell('B2').value = assessment.dpsName || '';
		sheet.getCell('B3').value = assessment.mandate || '';

		// Modality
		if (assessment.dpsModality === 'MANUAL') {
			sheet.getCell('C4').value = '☑ Manual';
		} else if (assessment.dpsModality === 'ELECTRONIC') {
			sheet.getCell('E4').value = '☑ Electronic / Automated';
		} else if (assessment.dpsModality === 'BOTH') {
			sheet.getCell('G4').value = '☑ Both';
		}

		// Role
		if (assessment.processingRole === 'PIC') {
			sheet.getCell('C5').value = '☑ Personal Information Controller (PIC)';
		} else if (assessment.processingRole === 'PIP') {
			sheet.getCell('F5').value = '☑ Personal Information Processor (PIP)';
		}

		// Outsourced
		if (assessment.isOutsourced === true) {
			sheet.getCell('C6').value = '☑ Yes';
		} else if (assessment.isOutsourced === false) {
			sheet.getCell('F6').value = '☑ No';
		}

		sheet.getCell('B7').value = assessment.piaStartDate ? new Date(assessment.piaStartDate).toLocaleDateString() : '';
		sheet.getCell('B8').value = assessment.piaEndDate ? new Date(assessment.piaEndDate).toLocaleDateString() : '';

		// 2. Authorized Parties
		const headOffice = assessment.authorizedParties.find(p => p.userType === 'HEAD_OFFICE');
		if (headOffice) {
			sheet.getCell('B11').value = headOffice.name || '';
			sheet.getCell('B12').value = headOffice.position || '';
			sheet.getCell('B13').value = headOffice.officeUnit || '';
			sheet.getCell('B16').value = headOffice.dateSigned ? new Date(headOffice.dateSigned).toLocaleDateString() : '';
		}

		const complianceOfficer = assessment.authorizedParties.find(p => p.userType === 'COMPLIANCE_OFFICER');
		if (complianceOfficer) {
			sheet.getCell('F11').value = complianceOfficer.name || '';
			sheet.getCell('F12').value = complianceOfficer.position || '';
			sheet.getCell('F13').value = complianceOfficer.email || '';
			sheet.getCell('F16').value = complianceOfficer.dateSigned ? new Date(complianceOfficer.dateSigned).toLocaleDateString() : '';
		}

		const reviewer = assessment.authorizedParties.find(p => p.userType === 'REVIEWER');
		if (reviewer) {
			sheet.getCell('B19').value = reviewer.name || '';
			sheet.getCell('B20').value = reviewer.position || 'DATA PROTECTION OFFICER';
			sheet.getCell('B23').value = reviewer.dateSigned ? new Date(reviewer.dateSigned).toLocaleDateString() : '';
		}

		const approvedBy = assessment.authorizedParties.find(p => p.userType === 'APPROVED_BY');
		if (approvedBy) {
			sheet.getCell('F19').value = approvedBy.name || '';
			sheet.getCell('F20').value = approvedBy.position || 'UNIVERSITY PRESIDENT';
			sheet.getCell('F23').value = approvedBy.dateSigned ? new Date(approvedBy.dateSigned).toLocaleDateString() : '';
		}

		// 3. A. PROCESS DATA LIFE CYCLE
		let pdlcRow = 37;
		assessment.pdlc.forEach(item => {
			sheet.getCell(`A${pdlcRow}`).value = item.stakeholderName || '';
			sheet.getCell(`C${pdlcRow}`).value = (item.collections || []).map(c => `${c.collection}${c.dateCollected ? ' (' + new Date(c.dateCollected).toLocaleDateString() + ')' : ''}`).join('\n');
			sheet.getCell(`D${pdlcRow}`).value = (item.uses || []).map(u => `${u.useOfData}: ${u.process}`).join('\n');
			sheet.getCell(`E${pdlcRow}`).value = item.retentionPeriod || '';
			sheet.getCell(`F${pdlcRow}`).value = (item.sharings || []).map(s => `${s.dataSharing} to ${s.sharedTo}`).join('\n');
			sheet.getCell(`G${pdlcRow}`).value = item.disposalMethod || '';
			pdlcRow++;
		});

		// 4. B. PERSONAL INFORMATION INVENTORY
		let piiRow = 98;
		assessment.pii.forEach(item => {
			sheet.getCell(`A${piiRow}`).value = `${item.formNo || ''} / ${item.formName || ''}`;
			sheet.getCell(`B${piiRow}`).value = item.dataProcessing || '';
			sheet.getCell(`C${piiRow}`).value = (item.piiDatasubjects || []).map(s => s.dataSubjectType?.dataSubjectType || '').join('\n');
			sheet.getCell(`D${piiRow}`).value = (item.piiDatasubjects || []).map(s => s.name || '').join('\n');
			sheet.getCell(`E${piiRow}`).value = (item.recipientUsers || []).map(r => r.recipientName || '').join('\n');
			sheet.getCell(`F${piiRow}`).value = item.piProcessBasis?.keyword || '';
			sheet.getCell(`G${piiRow}`).value = item.spiProcessBasis?.keyword || '';
			sheet.getCell(`H${piiRow}`).value = ''; // Processing Purpose not explicitly in model?
			piiRow++;
		});

		// 5. C. THREATS AND CONTROL MEASURES
		let threatRow = 129;
		assessment.threatsAndControls.forEach(item => {
			sheet.getCell(`A${threatRow}`).value = item.dataSubjects?.name || '';
			sheet.getCell(`B${threatRow}`).value = item.threats_possibleConsequences || '';
			sheet.getCell(`C${threatRow}`).value = item.typeOfThreats || '';
			sheet.getCell(`D${threatRow}`).value = item.currentSeverityLevel || '';
			sheet.getCell(`E${threatRow}`).value = item.currentLikelihoodLevel || '';
			sheet.getCell(`F${threatRow}`).value = item.currentRiskRating || '';
			sheet.getCell(`G${threatRow}`).value = item.proposedControl || '';
			sheet.getCell(`H${threatRow}`).value = item.typeOfMeasure || '';
			threatRow++;
		});

		// 6. D. SECURITY MEASURES
		const orgMeasures = assessment.securityMeasures.filter(m => m.securityType === 'ORGANIZATIONAL').map(m => m.description).join('\n');
		const physMeasures = assessment.securityMeasures.filter(m => m.securityType === 'PHYSICAL').map(m => m.description).join('\n');
		const techMeasures = assessment.securityMeasures.filter(m => m.securityType === 'TECHNICAL').map(m => m.description).join('\n');

		sheet.getCell('A159').value = orgMeasures;
		sheet.getCell('D159').value = physMeasures;
		sheet.getCell('F159').value = techMeasures;

		// 7. Checklist Footer
		if (assessment.isDataTransferredOutsidePh === true) sheet.getCell('G166').value = '☑ Yes';
		else if (assessment.isDataTransferredOutsidePh === false) sheet.getCell('H166').value = '☑ No';

		if (assessment.hasDataSharingAgreement === true) sheet.getCell('G167').value = '☑ Yes';
		else if (assessment.hasDataSharingAgreement === false) sheet.getCell('H167').value = '☑ No';

		if (assessment.isConsentUsed === true) sheet.getCell('G168').value = '☑ Yes';
		else if (assessment.isConsentUsed === false) sheet.getCell('H168').value = '☑ No';

		if (assessment.consentProof === 'CONSENT_FORM') sheet.getCell('F169').value = '☑ Consent Form';
		else if (assessment.consentProof === 'OTHER_PROOF') sheet.getCell('G169').value = '☑ Other proof of obtaining consent';
		else if (assessment.consentProof === 'BOTH') sheet.getCell('H169').value = '☑ Both';

		sheet.getCell('G170').value = assessment.pipName || '';

		if (assessment.isPublicFacing === 'EXTERNAL') sheet.getCell('F171').value = '☑ External';
		else if (assessment.isPublicFacing === 'INTERNAL') sheet.getCell('G171').value = '☑ Internal';
		else if (assessment.isPublicFacing === 'BOTH') sheet.getCell('H171').value = '☑ Both';

		if (assessment.hasAutomatedDecisionMaking) sheet.getCell('F172').value = '☑ Automated Decision Making';
		if (assessment.hasProfiling) {
			const currentVal = sheet.getCell('G172').value || '';
			sheet.getCell('G172').value = (currentVal ? currentVal + ' ' : '') + '☑ Profiling';
		}
		// If both were selected, Row 172 Col 8 is ALSO an option in template
		if (assessment.hasAutomatedDecisionMaking && assessment.hasProfiling) {
			sheet.getCell('H172').value = '☑ Both';
		}

		sheet.getCell('G173').value = assessment.legalBasis || '';
		sheet.getCell('G174').value = assessment.otherLegalBasisInfo || '';

		const fileBaseName = sanitizeFileName(assessment.dpsName || `assessment_${assessment.id}`);
		const fileName = `${fileBaseName}_${assessment.id}.xlsx`;

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

		await workbook.xlsx.write(res);
		res.end();
	} catch (error) {
		console.error('Export Excel error:', error);
		return res.status(500).send('Failed to export assessment.');
	}
};

module.exports = {
	exportAssessmentExcel
};
