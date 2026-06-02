const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
async function run() {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(path.join(__dirname,'exports','formats','DPO-PIA_Format.xlsx'));
    const sheet = wb.getWorksheet(1);
    let result = '';
    
    result += '--- Row 36 (PDLC Headers) ---\n';
    const r36 = sheet.getRow(36);
    for(let c=1; c<=8; c++) result += `C${c}: ${r36.getCell(c).value}\n`;

    result += '\n--- Row 96 (PII Headers) ---\n';
    const r96 = sheet.getRow(96);
    for(let c=1; c<=8; c++) result += `C${c}: ${r96.getCell(c).value}\n`;

    fs.writeFileSync('headers_check.txt', result);
}
run();
