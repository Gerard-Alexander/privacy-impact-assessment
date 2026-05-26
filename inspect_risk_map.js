const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function inspectRiskMapCols() {
    const workbook = new ExcelJS.Workbook();
    const templatePath = path.join(__dirname, 'exports', 'formats', 'DPO-PIA_Format.xlsx');
    await workbook.xlsx.readFile(templatePath);

    const sheet = workbook.getWorksheet(1);
    let output = 'Risk Map Area:\n';
    for (let r = 187; r <= 205; r++) {
        let rowText = `Row ${r}: `;
        for (let c = 1; c <= 8; c++) {
            const cell = sheet.getCell(r, c);
            output += `[C${c}: ${cell.value}] `;
        }
        output += '\n';
    }
    fs.writeFileSync('risk_map_inspect.txt', output);
    console.log("Dumped to risk_map_inspect.txt");
}

inspectRiskMapCols().catch(console.error);
