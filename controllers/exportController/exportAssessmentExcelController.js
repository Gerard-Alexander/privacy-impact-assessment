const path = require('path');
const fs = require('fs');
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
		sheet.getCell('C2').value = assessment.dpsName || '';
		sheet.getCell('C3').value = assessment.mandate || '';

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

		sheet.getCell('C7').value = assessment.piaStartDate ? new Date(assessment.piaStartDate).toLocaleDateString() : '';
		sheet.getCell('C8').value = assessment.piaEndDate ? new Date(assessment.piaEndDate).toLocaleDateString() : '';

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
			const retentionDateStr = item.retentionDate ? new Date(item.retentionDate).toLocaleDateString() : '';
			sheet.getCell(`E${pdlcRow}`).value = item.retentionPeriod
				? (retentionDateStr ? `${item.retentionPeriod} (${retentionDateStr})` : item.retentionPeriod)
				: retentionDateStr;
			sheet.getCell(`F${pdlcRow}`).value = (item.sharings || []).map(s => `${s.dataSharing} to ${s.sharedTo}`).join('\n');
			sheet.getCell(`G${pdlcRow}`).value = item.disposalMethod || '';
			pdlcRow++;
		});

		// Merge G37:H62 (disposal method column covers both G and H)
		for (let r = 37; r <= 62; r++) {
			try { sheet.mergeCells(`G${r}:H${r}`); } catch (_) { /* already merged in template */ }
		}

		// DLC Diagram image → rows 65–90, col A–H
		let dlcImageInserted = false;
		const dlcItem = assessment.pdlc.find(item => item.dlcDiagram);
		if (dlcItem && dlcItem.dlcDiagram) {
			try {
				// dlcDiagram may be stored as a full relative path or just the filename
				const rawDiagram = dlcItem.dlcDiagram;
				const uploadsBase = path.join(__dirname, '..', '..', 'uploads', 'dlc');
				// Support both "uploads/dlc/file.png" and bare "file.png"
				const imgFileName = path.basename(rawDiagram);
				const imgPath = path.join(uploadsBase, imgFileName);

				if (fs.existsSync(imgPath)) {
					const ext = path.extname(imgFileName).replace('.', '').toLowerCase();
					const mimeMap = { png: 'png', jpg: 'jpeg', jpeg: 'jpeg', gif: 'gif' };
					const imageType = mimeMap[ext] || 'png';

					const imageId = workbook.addImage({
						filename: imgPath,
						extension: imageType
					});

					sheet.addImage(imageId, {
						tl: { col: 0, row: 64 }, // A65 (0-indexed)
						br: { col: 8, row: 90 }, // H90 (0-indexed, exclusive)
						editAs: 'oneCell'
					});
					dlcImageInserted = true; // flag so blank-row hider can skip these rows
				} else {
					console.warn(`DLC image not found: ${imgPath}`);
				}
			} catch (imgErr) {
				console.error('Failed to insert DLC image:', imgErr);
			}
		}

		// 4. B. PERSONAL INFORMATION INVENTORY
		// One row per PII item. Multi-value fields (C, D, E) are comma-separated in a single cell.
		let piiRow = 97;
		assessment.pii.forEach(item => {
			const subjects   = item.piiDatasubjects || [];
			const recipients = item.recipientUsers  || [];

			// Col A – Data Capture Form No. / Name
			sheet.getCell(`A${piiRow}`).value = `${item.formNo || ''} / ${item.formName || ''}`;

			// Col B – Data Processing
			sheet.getCell(`B${piiRow}`).value = item.dataProcessing || '';

			// Col C – Data Subjects (type), comma-separated
			sheet.getCell(`C${piiRow}`).value = subjects.map(s => s.dataSubjectType?.dataSubjectType || '').filter(Boolean).join(', ');

			// Col D – Personal Information of Data Subjects, comma-separated
			sheet.getCell(`D${piiRow}`).value = subjects.map(s => s.name || '').filter(Boolean).join(', ');

			// Col E – Recipients / Users, comma-separated
			sheet.getCell(`E${piiRow}`).value = recipients.map(r => r.recipientName || '').filter(Boolean).join(', ');

			// Col F – Basis of Processing PI
			sheet.getCell(`F${piiRow}`).value = item.piProcessBasis?.keyword || '';

			// Col G – Basis of Processing SPI
			sheet.getCell(`G${piiRow}`).value = item.spiProcessBasis?.keyword || '';

			// Col H – Processing Purpose (not stored in model — leave cell untouched)

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
			sheet.getCell('G172').value = '☑ Profiling';
		}
		// If both were selected, Row 172 Col 8 is ALSO an option in template
		if (assessment.hasAutomatedDecisionMaking && assessment.hasProfiling) {
			sheet.getCell('H172').value = '☑ Both';
		}

		sheet.getCell('G173').value = assessment.legalBasis || '';
		sheet.getCell('G174').value = assessment.otherLegalBasisInfo || '';

		// ── 8. E. RISK MAP ───────────────────────────────────────────────────────
		const heatmapBase = path.join(__dirname, '..', '..', 'exports', 'heatmaps');
		const beforeMapPath = path.join(heatmapBase, `${assessment.id}-before.png`);
		const afterMapPath = path.join(heatmapBase, `${assessment.id}-after.png`);

		// Force E. RISK MAP section to a new page
		sheet.getRow(189).addPageBreak();
		sheet.getCell('A189').value = 'E. RISK MAP';
		sheet.getCell('A189').font = { bold: true, size: 14, color: { argb: 'FF0D1B4B' } };

		// Shared row range for both maps: Row 191 to 204 (0-indexed: row 190 to 204)
		const startGridRow = 190;
		const endGridRow = 204;

		// Before Map (A-D)
		if (fs.existsSync(beforeMapPath)) {
			sheet.getCell('A190').value = 'BEFORE CONTROLS';
			sheet.getCell('A190').font = { bold: true, size: 10 };

			try {
				const imgId = workbook.addImage({
					filename: beforeMapPath,
					extension: 'png'
				});
				sheet.addImage(imgId, {
					tl: { col: 0, row: startGridRow }, // Col A
					br: { col: 4, row: endGridRow },   // Col D (end of D is col 4)
					editAs: 'oneCell'
				});
			} catch (err) {
				console.error('Error adding before heatmap:', err);
			}
		}

		// After Map (F-H)
		if (fs.existsSync(afterMapPath)) {
			sheet.getCell('F190').value = 'AFTER CONTROLS';
			sheet.getCell('F190').font = { bold: true, size: 10 };

			try {
				const imgId = workbook.addImage({
					filename: afterMapPath,
					extension: 'png'
				});
				sheet.addImage(imgId, {
					tl: { col: 5, row: startGridRow }, // Col F
					br: { col: 8, row: endGridRow },   // Col H (end of H is col 8)
					editAs: 'oneCell'
				});
			} catch (err) {
				console.error('Error adding after heatmap:', err);
			}
		}

		const fileBaseName = sanitizeFileName(assessment.dpsName || `assessment_${assessment.id}`);
		const fileName = `${fileBaseName}_${assessment.id}.xlsx`;

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

		// ── POST-FILL FORMATTING ─────────────────────────────────────────────────
		// Goal: apply wrap-text / top-alignment only to cells that have real data;
		//       expand row height proportionally; lock print area; preserve template
		//       column widths (do NOT override them — the template owns those).

		const LINE_HEIGHT_PT = 14; // approximate points per wrapped text line

		sheet.eachRow({ includeEmpty: false }, (row) => {
			let hasContent = false;
			let maxLines   = 1;

			for (let c = 1; c <= 8; c++) {
				const cell = row.getCell(c);
				const val  = cell.value;

				// Skip truly empty cells and ExcelJS merge-slave cells (type === 6)
				if (val === null || val === undefined || val === '') continue;
				if (cell.type === 6) continue; // non-master cell of a merge

				hasContent = true;

				// Apply wrap-text + top-left alignment
				cell.alignment = {
					wrapText:   true,
					vertical:   'top',
					horizontal: 'left'
				};

				// Estimate line count using the column's actual character width
				// (falls back to 20 if the template hasn't set one)
				const colWidth = sheet.getColumn(c).width || 20;
				const txt = String(val);
				const lines = txt.split('\n').reduce((sum, line) => {
					return sum + Math.max(1, Math.ceil(line.length / colWidth));
				}, 0);
				maxLines = Math.max(maxLines, lines);
			}

			// Expand the row if content needs more space — never shrink template rows
			if (hasContent) {
				const needed = Math.max(maxLines * LINE_HEIGHT_PT, 15);
				if (needed > (row.height || 0)) {
					row.height = Math.min(needed, 409); // 409 pt = Excel's max row height
				}
			}
		});

		// ── HIDE BLANK TEMPLATE ROWS ──────────────────────────────────────────────────
		// The template pre-allocates rows for each data section. Any row in those
		// zones that was NOT written to is hidden so it disappears from both the
		// file view and from print / PDF export (hidden rows are never printed).

		const hideRows = (from, to) => {
			for (let r = from; r <= to; r++) {
				sheet.getRow(r).hidden = true;
			}
		};

		// PDLC data zone: template allocates rows 37–62
		if (pdlcRow <= 62) hideRows(pdlcRow, 62);

		// DLC diagram zone: template allocates rows 65–90
		// Only hide if no image was actually inserted
		if (!dlcImageInserted) hideRows(65, 90);

		// PII data zone: template allocates rows 97–124
		if (piiRow <= 124) hideRows(piiRow, 124);

		// Threats data zone: template allocates rows 129–155
		if (threatRow <= 155) hideRows(threatRow, 155);
		// ─────────────────────────────────────────────────────────────────────────

		// ── PRINT / PAGE SETUP ──────────────────────────────────────────────────
		const lastDataRow = sheet.lastRow?.number || 300;
		sheet.pageSetup = {
			...sheet.pageSetup,       // preserve template's header/footer references
			paperSize:          9,    // A4
			orientation:        'landscape',
			fitToPage:          true,
			fitToWidth:         1,    // always 1 page wide
			fitToHeight:        0,    // unlimited pages tall
			horizontalCentered: true,
			printArea:          `A1:H${lastDataRow}`,
			margins: {
				left:   0.5,  right:  0.5,
				top:    0.75, bottom: 0.75,
				header: 0.3,  footer: 0.3
			}
		};
		// ─────────────────────────────────────────────────────────────────────────

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
