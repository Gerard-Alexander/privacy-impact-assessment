const ExcelJS = require('exceljs');
const path = require('path');

async function listAllCellsInFirstSheet() {
    const workbook = new ExcelJS.Workbook();
    const templatePath = path.join(__dirname, 'exports', 'formats', 'DPO-PIA_Format.xlsx');
    await workbook.xlsx.readFile(templatePath);

    const sheet = workbook.getWorksheet(1);
    console.log(`Sheet Name: ${sheet.name}`);
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        let rowText = `Row ${rowNumber}: `;
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            rowText += `[C${colNumber}: ${cell.value}] `;
        });
        console.log(rowText);
    });
}

listAllCellsInFirstSheet().catch(console.error);
