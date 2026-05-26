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

		addSheet(
			workbook,
			'Summary',
			['Field', 'Value'],
			[
				['DPS Name', assessment.dpsName],
				['Mandate', assessment.mandate],
				['Modality', assessment.dpsModality],
				['Processing Role', assessment.processingRole],
				['Outsourced', assessment.isOutsourced ? 'Yes' : 'No'],
				['PIA Start Date', assessment.piaStartDate],
				['PIA End Date', assessment.piaEndDate],
				['Status', assessment.status],
				['Privacy Notice Acknowledged', assessment.privacyNoticeAcknowledged ? 'Yes' : 'No'],
				['Data Transferred Outside PH', assessment.isDataTransferredOutsidePh ? 'Yes' : 'No'],
				['Data Sharing Agreement', assessment.hasDataSharingAgreement ? 'Yes' : 'No'],
				['PIP Name', assessment.pipName || ''],
				['Public Facing', assessment.isPublicFacing || ''],
				['Automated Decision', assessment.hasAutomatedDecisionMaking ? 'Yes' : 'No'],
				['Profiling', assessment.hasProfiling ? 'Yes' : 'No'],
				['Legal Basis', assessment.legalBasis || ''],
				['Other Legal Basis', assessment.otherLegalBasisInfo || ''],
				['Consent Used', assessment.isConsentUsed ? 'Yes' : 'No'],
				['Consent Proof', assessment.consentProof || '']
			]
		);

		addSheet(
			workbook,
			'Authorized Parties',
			['Name', 'Position', 'Office Unit', 'Email', 'Role', 'Date Signed'],
			assessment.authorizedParties.map((party) => [
				party.name,
				party.position,
				party.officeUnit,
				party.email,
				party.userType,
				party.dateSigned || ''
			])
		);

		addSheet(
			workbook,
			'PDLC',
			['Stakeholder', 'Retention Period', 'Retention Date', 'Disposal Method'],
			assessment.pdlc.map((pdlc) => [
				pdlc.stakeholderName,
				pdlc.retentionPeriod,
				pdlc.retentionDate || '',
				pdlc.disposalMethod
			])
		);

		addSheet(
			workbook,
			'PDLC Collections',
			['Stakeholder', 'Collection', 'Date Collected'],
			assessment.pdlc.flatMap((pdlc) =>
				(pdlc.collections || []).map((item) => [
					pdlc.stakeholderName,
					item.collection,
					item.dateCollected || ''
				])
			)
		);

		addSheet(
			workbook,
			'PDLC Uses',
			['Stakeholder', 'Use Of Data', 'Process'],
			assessment.pdlc.flatMap((pdlc) =>
				(pdlc.uses || []).map((item) => [
					pdlc.stakeholderName,
					item.useOfData,
					item.process
				])
			)
		);

		addSheet(
			workbook,
			'PDLC Sharing',
			['Stakeholder', 'Data Sharing', 'Shared To'],
			assessment.pdlc.flatMap((pdlc) =>
				(pdlc.sharings || []).map((item) => [
					pdlc.stakeholderName,
					item.dataSharing,
					item.sharedTo
				])
			)
		);

		addSheet(
			workbook,
			'PII',
			['Form No', 'Form Name', 'Processing Type', 'PI Basis', 'SPI Basis', 'Form Image'],
			assessment.pii.map((pii) => [
				pii.formNo,
				pii.formName,
				pii.dataProcessing,
				pii.piProcessBasis?.keyword || '',
				pii.spiProcessBasis?.keyword || '',
				pii.dataFormImagePath || ''
			])
		);

		addSheet(
			workbook,
			'PII Data Subjects',
			['Form Name', 'Data Subject Type', 'Name'],
			assessment.pii.flatMap((pii) =>
				(pii.piiDatasubjects || []).map((subject) => [
					pii.formName,
					subject.dataSubjectType?.dataSubjectType || '',
					subject.name
				])
			)
		);

		addSheet(
			workbook,
			'Recipients',
			['Form Name', 'Recipient Name'],
			assessment.pii.flatMap((pii) =>
				(pii.recipientUsers || []).map((recipient) => [
					pii.formName,
					recipient.recipientName
				])
			)
		);

		addSheet(
			workbook,
			'Threats & Controls',
			[
				'Assessment',
				'Data Subject',
				'Data Subject Type',
				'Stakeholder',
				'Consequence',
				'Threat Types',
				'Severity',
				'Likelihood',
				'Risk Rating',
				'Proposed Control',
				'After Severity',
				'After Likelihood',
				'After Risk Rating',
				'Measure Type'
			],
			assessment.threatsAndControls.map((threat) => [
				assessment.dpsName,
				threat.dataSubjects?.name || '',
				threat.dataSubjects?.dataSubjectType?.dataSubjectType || '',
				threat.pdlc?.stakeholderName || '',
				threat.threats_possibleConsequences || '',
				threat.typeOfThreats || '',
				threat.currentSeverityLevel || '',
				threat.currentLikelihoodLevel || '',
				threat.currentRiskRating || '',
				threat.proposedControl || '',
				threat.afterSeverityLevel || '',
				threat.afterLikelihoodLevel || '',
				threat.afterRiskRating || '',
				threat.typeOfMeasure || ''
			])
		);

		addSheet(
			workbook,
			'Security Measures',
			['Security Type', 'Description'],
			assessment.securityMeasures.map((measure) => [
				measure.securityType,
				measure.description
			])
		);

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
