const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function listAllCellsToFile() {
    const workbook = new ExcelJS.Workbook();
    const templatePath = path.join(__dirname, 'exports', 'formats', 'DPO-PIA_Format.xlsx');
    await workbook.xlsx.readFile(templatePath);

    let output = '';
    workbook.eachSheet((sheet, id) => {
        output += `Sheet ID: ${id}, Name: "${sheet.name}"\n`;
        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            let rowText = `  Row ${rowNumber}: `;
            row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                let val = cell.value;
                if (val && typeof val === 'object' && val.richText) {
                    val = val.richText.map(rt => rt.text).join('');
                }
                rowText += `[C${colNumber}: ${val}] `;
            });
            output += rowText + '\n';
        });
        output += '\n' + '='.repeat(50) + '\n\n';
    });

    fs.writeFileSync('template_dump.txt', output);
    console.log("Dumped to template_dump.txt");
}

listAllCellsToFile().catch(console.error);
