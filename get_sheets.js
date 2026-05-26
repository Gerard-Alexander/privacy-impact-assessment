const ExcelJS = require('exceljs');
const path = require('path');

async function getSheetNames() {
    const workbook = new ExcelJS.Workbook();
    const templatePath = path.join(__dirname, 'exports', 'formats', 'DPO-PIA_Format.xlsx');
    await workbook.xlsx.readFile(templatePath);

    console.log("Sheets found:");
    workbook.eachSheet((sheet, id) => {
        console.log(`- ID: ${id}, Name: "${sheet.name}"`);
    });
}

getSheetNames().catch(console.error);
