const ExcelJS = require('exceljs');
const path = require('path');

async function inspectTemplate() {
    const workbook = new ExcelJS.Workbook();
    const templatePath = path.join(__dirname, 'exports', 'formats', 'DPO-PIA_Format.xlsx');
    await workbook.xlsx.readFile(templatePath);

    const keywords = ['NAME', 'MANDATE', 'MODALITY', 'ROLE', 'START', 'END', 'STAKEHOLDER', 'RETENTION', 'DISPOSAL', 'FORM', 'THREAT', 'SEVERITY', 'LIKELIHOOD', 'RISK', 'MEASURE'];

    workbook.eachSheet((sheet, id) => {
        console.log(`Sheet ID: ${id}, Name: ${sheet.name}`);
        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                const val = String(cell.value).toUpperCase();
                if (keywords.some(k => val.includes(k))) {
                    console.log(`  Row ${rowNumber}, Col ${colNumber}: ${cell.value}`);
                }
            });
        });
    });
}

inspectTemplate().catch(console.error);
