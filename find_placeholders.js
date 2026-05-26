const ExcelJS = require('exceljs');
const path = require('path');

async function findPlaceholders() {
    const workbook = new ExcelJS.Workbook();
    const templatePath = path.join(__dirname, 'exports', 'formats', 'DPO-PIA_Format.xlsx');
    await workbook.xlsx.readFile(templatePath);

    workbook.eachSheet((sheet, id) => {
        console.log(`Sheet ID: ${id}, Name: ${sheet.name}`);
        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                if (cell.value && typeof cell.value === 'string' && cell.value.includes('{{')) {
                    console.log(`  Row ${rowNumber}, Col ${colNumber}: ${cell.value}`);
                }
            });
        });
    });
}

findPlaceholders().catch(console.error);
