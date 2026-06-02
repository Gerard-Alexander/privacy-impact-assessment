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
		const sheet = workbook.getWorksheet(1);

		// ── HEADER LOGOS ────────────────────────────────────────────────────────
		const sluLogoPath = path.join(__dirname, '..', '..', 'public', 'images', 'slu-logo.jpg');
		const dpoLogoPath = path.join(__dirname, '..', '..', 'public', 'images', 'dpo-logo.png');

		if (fs.existsSync(sluLogoPath)) {
			const sluImage = workbook.addImage({ filename: sluLogoPath, extension: 'jpeg' });
			sheet.addImage(sluImage, {
				tl: { col: 0.1, row: 0.1 },
				ext: { width: 75, height: 75 },
				editAs: 'oneCell'
			});
		}
		if (fs.existsSync(dpoLogoPath)) {
			const dpoImage = workbook.addImage({ filename: dpoLogoPath, extension: 'png' });
			sheet.addImage(dpoImage, {
				tl: { col: 7.2, row: 0.1 },
				ext: { width: 75, height: 75 },
				editAs: 'oneCell'
			});
		}

		// 1. Basic Info
		sheet.getCell('C2').value = assessment.dpsName || '';
		sheet.getCell('C3').value = assessment.mandate || '';

		// ... (rest of basic info processing remains the same)
		if (assessment.dpsModality === 'MANUAL') sheet.getCell('C4').value = '☑ Manual';
		else if (assessment.dpsModality === 'ELECTRONIC') sheet.getCell('E4').value = '☑ Electronic / Automated';
		else if (assessment.dpsModality === 'BOTH') sheet.getCell('G4').value = '☑ Both';
		
		if (assessment.processingRole === 'PIC') sheet.getCell('C5').value = '☑ Personal Information Controller (PIC)';
		else if (assessment.processingRole === 'PIP') sheet.getCell('F5').value = '☑ Personal Information Processor (PIP)';
		
		if (assessment.isOutsourced === true) sheet.getCell('C6').value = '☑ Yes';
		else if (assessment.isOutsourced === false) sheet.getCell('F6').value = '☑ No';

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

		// Dynamic merging for PDLC rows (G:H for disposal method)
		const lastMergeRow = Math.max(62, pdlcRow);
		for (let r = 37; r <= lastMergeRow; r++) {
			try {
				// Only merge if not already merged in the worksheet
				const cell = sheet.getCell(`G${r}`);
				if (!cell.isMerged) {
					sheet.mergeCells(`G${r}:H${r}`); 
				}
			} catch (_) { /* ignore already merged errors */ }
		}

		// ── DLC DIAGRAM (FIXED PLACEMENT AT ROWS 65-93) ──
		let dlcImageEndRow = 93; 
		let dlcImageInserted = false;
		
		// Add page break before DLC diagram to ensure it starts on a new page (Page 5)
		sheet.getRow(64).addPageBreak();
		const dlcItem = assessment.pdlc.find(item => item.dlcDiagram);
		const projectRoot = path.join(__dirname, '..', '..');
		const dlcExportsBase = path.join(projectRoot, 'exports', 'dlc');

		// Resolve the actual image path (with robust fallback)
		let resolvedDlcPath = null;
		const findImageInFolder = (folder) => {
			if (!fs.existsSync(folder)) return null;
			const files = fs.readdirSync(folder);
			// Look for common image extensions
			const imgFiles = files.filter(f => /\.(png|jpe?g|webp|gif)$/i.test(f));
			if (imgFiles.length === 0) return null;
			// Sort by modified time (descending) to get the most recent one
			imgFiles.sort((a, b) => {
				return fs.statSync(path.join(folder, b)).mtime.getTime() - 
				       fs.statSync(path.join(folder, a)).mtime.getTime();
			});
			return path.join(folder, imgFiles[0]); // Return the most recent
		};

		if (dlcItem && dlcItem.dlcDiagram && !dlcItem.dlcDiagram.match(/^,+$/)) {
			const rawVal = dlcItem.dlcDiagram;
			const candidateRelative = path.join(projectRoot, ...rawVal.replace(/\/\\/g, '/').split('/'));
			const candidateBasename = path.join(dlcExportsBase, path.basename(rawVal));
			
			if (fs.existsSync(candidateRelative)) {
				resolvedDlcPath = candidateRelative;
			} else if (fs.existsSync(candidateBasename)) {
				resolvedDlcPath = candidateBasename;
			}
		}

		// SUPER FALLBACK: If DB path is missing/invalid, try to find ANY image in the dlc folder
		if (!resolvedDlcPath) {
			resolvedDlcPath = findImageInFolder(dlcExportsBase);
		}

		if (resolvedDlcPath) {
			try {
				const ext = path.extname(resolvedDlcPath).replace('.', '').toLowerCase();
				const imageId = workbook.addImage({
					filename: resolvedDlcPath,
					extension: ext === 'jpg' ? 'jpeg' : (ext || 'png')
				});

				// User requested the diagram to be exactly 8cm x 8cm
				const startImageRow = 65;
				
				// Move DLC Title to Row 64 (from 63)
				sheet.getCell('A64').value = 'DATA LIFE CYCLE DIAGRAM';
				sheet.getCell('A64').font = { bold: true, size: 12 };
				try { sheet.getCell('A63').value = null; } catch(_) {}

				// Clear the targeted zone and ensure row heights are adequate to fit on one page
				// 65-93 is 29 rows. 18pt height * 29 = 522pt, which fits one landscape page.
				for (let r = 65; r <= 93; r++) {
					const row = sheet.getRow(r);
					row.height = 18; 
					for (let c = 1; c <= 8; c++) {
						row.getCell(c).value = null;
					}
				}

				// Place diagram at A65 with fixed dimensions 8cm x 8cm 
				// 8cm is ~302.36 pixels at 96 DPI
				sheet.addImage(imageId, {
					tl: { col: 0.1,  row: startImageRow - 0.8 }, // Slight offset for better alignment
					ext: { width: 302.36, height: 302.36 },
					editAs: 'oneCell'
				});

				dlcImageInserted = true;
				dlcImageEndRow   = 93; 
			} catch (err) {
				console.error('DLC image insertion error:', err);
			}
		}

		// 4. B. PERSONAL INFORMATION INVENTORY
		// Section B Title: 94, Headers: 96, Data starts at: 97
		let piiStartRow = Math.max(97, dlcImageEndRow + 5); 
		let piiRow = piiStartRow;

		// Move Section B title if shifted
		if (piiStartRow > 97) {
			sheet.getCell(`A${piiStartRow - 3}`).value = 'B. PERSONAL INFORMATION INVENTORY';
			sheet.getCell(`A${piiStartRow - 3}`).font = { bold: true, size: 12 };
			// Move Section B Headers too
			const headers = ['Data Capture Form No. / Name', 'Data Processing', 'Data Subjects', 'Personal Information of Data Subjects', 'Recipients / Users of Personal Information', 'Basis of Processing PI', 'Basis of Processing SPI', 'Processing Purpose'];
			const headerRow = sheet.getRow(piiStartRow - 1);
			headers.forEach((h, i) => {
				headerRow.getCell(i + 1).value = h;
				headerRow.getCell(i + 1).font = { bold: true };
			});
			// Clear original template locations
			try { sheet.getCell('A94').value = null; } catch(_) {}
			try { sheet.getRow(96).values = []; } catch(_) {}
		}

		assessment.pii.forEach(item => {
			const subjects = item.piiDatasubjects || [];
			const recipients = item.recipientUsers || [];
			sheet.getCell(`A${piiRow}`).value = `${item.formNo || ''} / ${item.formName || ''}`;
			sheet.getCell(`B${piiRow}`).value = item.dataProcessing || '';
			sheet.getCell(`C${piiRow}`).value = subjects.map(s => s.dataSubjectType?.dataSubjectType || '').filter(Boolean).join(', ');
			sheet.getCell(`D${piiRow}`).value = subjects.map(s => s.name || '').filter(Boolean).join(', ');
			sheet.getCell(`E${piiRow}`).value = recipients.map(r => r.recipientName || '').filter(Boolean).join(', ');
			sheet.getCell(`F${piiRow}`).value = item.piProcessBasis?.keyword || '';
			sheet.getCell(`G${piiRow}`).value = item.spiProcessBasis?.keyword || '';
			// Column H is Processing Purpose - we don't have a direct field, leaving blank or using mandate as hint
			sheet.getCell(`H${piiRow}`).value = ''; 
			piiRow++;
		});

		// 5. C. THREATS AND CONTROL MEASURES
		// Section C Title: 125, Header: 127, Data starts at: 128
		let threatStartRow = Math.max(128, piiRow + 5);
		// Add page break before Section C
		sheet.getRow(threatStartRow - 3).addPageBreak();
		let threatRow = threatStartRow;

		// Move Section C title (originally row 125, move to 126 to be with 127/128)
		const threatTitleRow = threatStartRow - 2;
		sheet.getCell(`A${threatTitleRow}`).value = 'C. THREATS AND CONTROL MEASURES';
		sheet.getCell(`A${threatTitleRow}`).font = { bold: true, size: 12 };
		
		// Move Headers
		const headersC = ['Data Subject/s Impacted', 'Threats & Possible Consequence/s', 'Type of Threat', 'Severity Level', 'Likelihood', 'Risk Rating', 'Proposed Control Measures', 'Type of Measure'];
		const headerRowC = sheet.getRow(threatStartRow - 1);
		headersC.forEach((h, i) => {
			headerRowC.getCell(i + 1).value = h;
			headerRowC.getCell(i + 1).font = { bold: true };
		});
		
		// Clear original template locations if they've been moved
		try { sheet.getCell('A125').value = null; } catch(_) {}
		if (threatStartRow > 128) {
			try { sheet.getRow(127).values = []; } catch(_) {}
		}

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
		// Section D Title: 156, Header: 158, Data starts at: 159
		let securityMeasuresStartRow = Math.max(159, threatRow + 5);
		// Add page break before Section D
		sheet.getRow(securityMeasuresStartRow - 3).addPageBreak();
		
		// Move Section D title (originally row 156, move to 157 to be with 158/159)
		const securityTitleRow = securityMeasuresStartRow - 2;
		sheet.getCell(`A${securityTitleRow}`).value = 'D. SECURITY MEASURES';
		sheet.getCell(`A${securityTitleRow}`).font = { bold: true, size: 12 };
		
		// Move Headers
		sheet.getCell(`A${securityMeasuresStartRow - 1}`).value = 'Organizational';
		sheet.getCell(`D${securityMeasuresStartRow - 1}`).value = 'Physical';
		sheet.getCell(`F${securityMeasuresStartRow - 1}`).value = 'Technical';
		sheet.getCell(`A${securityMeasuresStartRow - 1}`).font = { bold: true };
		sheet.getCell(`D${securityMeasuresStartRow - 1}`).font = { bold: true };
		sheet.getCell(`F${securityMeasuresStartRow - 1}`).font = { bold: true };

		// Clear original template locations
		try { sheet.getCell('A156').value = null; } catch(_) {}
		if (securityMeasuresStartRow > 159) {
			try { sheet.getRow(158).values = []; } catch(_) {}
		}
		const orgMeasures = assessment.securityMeasures.filter(m => m.securityType === 'ORGANIZATIONAL').map(m => m.description).join('\n');
		const physMeasures = assessment.securityMeasures.filter(m => m.securityType === 'PHYSICAL').map(m => m.description).join('\n');
		const techMeasures = assessment.securityMeasures.filter(m => m.securityType === 'TECHNICAL').map(m => m.description).join('\n');

		sheet.getCell(`A${securityMeasuresStartRow}`).value = orgMeasures;
		sheet.getCell(`D${securityMeasuresStartRow}`).value = physMeasures;
		sheet.getCell(`F${securityMeasuresStartRow}`).value = techMeasures;

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

		// ── 8. E. RISK MAP (FLEXIBLE PLACEMENT) ──────────────────────────────────
		const heatmapBase = path.join(__dirname, '..', '..', 'exports', 'heatmaps');
		const beforeMapPath = path.join(heatmapBase, `${assessment.id}-before.png`);
		const afterMapPath = path.join(heatmapBase, `${assessment.id}-after.png`);

		// Start Section E after Section D (Security Measures)
		let riskMapStartRow = Math.max(187, securityMeasuresStartRow + 5);
		
		sheet.getCell(`A${riskMapStartRow}`).value = 'E. RISK MAP';
		sheet.getCell(`A${riskMapStartRow}`).font = { bold: true, size: 14, color: { argb: 'FF0D1B4B' } };

		// Put title together with labels (remove the gap)
		const startGridRow = riskMapStartRow + 1; // Titles at riskMapStartRow, Labels at riskMapStartRow + 1
		const endGridRow   = startGridRow + 15;

		// Before Map (A-D)
		if (fs.existsSync(beforeMapPath)) {
			sheet.getCell(`A${startGridRow}`).value = 'BEFORE CONTROLS';
			sheet.getCell(`A${startGridRow}`).font = { bold: true, size: 10 };

			try {
				const imgId = workbook.addImage({
					filename: beforeMapPath,
					extension: 'png'
				});
				sheet.addImage(imgId, {
					tl: { col: 0.1, row: startGridRow + 0.2 }, // Start immediately below label
					ext: { width: 277.8, height: 278.9 },     // 7.35cm width, 7.38cm height
					editAs: 'oneCell'
				});
			} catch (err) {
				console.error('Error adding before heatmap:', err);
			}
		}

		// After Map (F-H)
		if (fs.existsSync(afterMapPath)) {
			sheet.getCell(`F${startGridRow}`).value = 'AFTER CONTROLS';
			sheet.getCell(`F${startGridRow}`).font = { bold: true, size: 10 };

			try {
				const imgId = workbook.addImage({
					filename: afterMapPath,
					extension: 'png'
				});
				sheet.addImage(imgId, {
					tl: { col: 5.1, row: startGridRow + 0.2 }, // Start immediately below label
					ext: { width: 277.8, height: 278.9 },     // 7.35cm width, 7.38cm height
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

		const LINE_HEIGHT_PT = 15; // approximate points per wrapped text line

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
				// (falls back to 15 if the template hasn't set one)
				const colWidth = sheet.getColumn(c).width || 15;
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

		// DLC diagram zone: template allocates rows 65–93
		// If image was inserted at or below row 65, we manage visibility carefully.
		// If no image, hide the whole zone.
		if (!dlcImageInserted) {
			hideRows(65, 93);
		} else {
			// If diagram was pushed BELOW the template zone, hide the template zone
			const startDlcRow = Math.max(65, pdlcRow + 2);
			if (startDlcRow > 65) {
				hideRows(65, 93);
			}
		}

		// PII data zone: template allocates rows 97–124
		if (piiRow <= 124) hideRows(piiRow, 124);

		// Threats data zone: template allocates rows 129–155
		if (threatRow <= 155) hideRows(threatRow, 155);

		// Risk Map zone: template allocates rows 189–230
		// If map was moved, hide the template's default zone
		if (riskMapStartRow > 187) {
			hideRows(189, 230);
		}
		
		// Hide all trailing rows beyond the template sections to clear "Page 11" and any others
		hideRows(231, 500);
		// ─────────────────────────────────────────────────────────────────────────

		// ── PRINT / PAGE SETUP ──────────────────────────────────────────────────
		// Clear any manual page breaks that might exist in the template and add our own
		// (The addPageBreak() calls above populate the sheet.rowBreaks)

		const lastDataRow = sheet.lastRow?.number || 300;
		sheet.pageSetup = {
			...sheet.pageSetup,       // preserve template's header/footer references
			paperSize:          9,    // A4
			orientation:        'landscape',
			fitToPage:          false,   // Use manual breaks to define pages instead of forced scaling
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
