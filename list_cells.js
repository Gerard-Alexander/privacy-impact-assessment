const ExcelJS = require('exceljs');
const path = require('path');

async function listCells() {
    const workbook = new ExcelJS.Workbook();
    const templatePath = path.join(__dirname, 'exports', 'formats', 'DPO-PIA_Format.xlsx');
    await workbook.xlsx.readFile(templatePath);

    workbook.eachSheet((sheet, id) => {
        console.log(`Sheet ID: ${id}, Name: ${sheet.name}`);
        let count = 0;
        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                if (count < 20) {
                    console.log(`  Row ${rowNumber}, Col ${colNumber}: ${cell.value}`);
                    count++;
                }
            });
        });
    });
}

listCells().catch(console.error);
