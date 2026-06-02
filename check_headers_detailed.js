const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
async function run() {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(path.join(__dirname,'exports','formats','DPO-PIA_Format.xlsx'));
    const sheet = wb.getWorksheet(1);
    let result = '';
    
    [32, 36, 63, 64, 85, 94, 96, 125, 127, 156, 158].forEach(rNum => {
        result += `--- Row ${rNum} ---\n`;
        const row = sheet.getRow(rNum);
        for(let c=1; c<=8; c++) {
            const v = row.getCell(c).value;
            result += `C${c}: ${v ? JSON.stringify(v) : 'null'}\n`;
        }
        result += '\n';
    });

    fs.writeFileSync('detailed_headers.txt', result);
}
run();
