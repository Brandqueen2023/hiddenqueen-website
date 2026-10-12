/* Baut eine leere, rechenfaehige Kalkulationsvorlage fuer "The Invitation".
   Alle Zahlenfelder bleiben leer (0) -- nur Struktur und Formeln stehen fest.
   Keine erfundenen Einkaufspreise oder Materialien. */
const ExcelJS = require('C:/Users/Brandqueen_CAD/.claude/sessions/node_modules/exceljs');

const BESTANDTEILE = [
  'Versiegelter Brief',
  'Augenmaske oder feines Band',
  'Kleines handgefertigtes Schluesselobjekt',
  'Duft oder Kerze',
  'Ritualkarten',
  'Optionale persoenliche Gravur',
  'Verpackung / Konfektionsmaterial',
];

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'HiddenQueen';
  const ws = wb.addWorksheet('Kalkulation The Invitation');

  ws.columns = [
    { header: 'Bestandteil', key: 'name', width: 38 },
    { header: 'Einkaufspreis (EK, netto, EUR)', key: 'ek', width: 26 },
    { header: 'Menge (Stueck je Set)', key: 'menge', width: 20 },
    { header: 'Summe (EUR)', key: 'summe', width: 16 },
  ];
  ws.getRow(1).font = { bold: true };

  let row = 2;
  const firstDataRow = row;
  for (const name of BESTANDTEILE) {
    ws.getRow(row).values = [name, null, 1, { formula: `B${row}*C${row}` }];
    row++;
  }
  const lastDataRow = row - 1;

  row++; // Leerzeile
  const sumWareneinsatzRow = row;
  ws.getRow(row).values = ['Summe Wareneinsatz', null, null, { formula: `SUM(D${firstDataRow}:D${lastDataRow})` }];
  ws.getRow(row).font = { bold: true };
  row++;

  row++; // Leerzeile
  ws.getRow(row).values = ['Konfektionierung / Verpackung', 'Zeit (Minuten)', 'Stundensatz (EUR/h)', 'Kosten (EUR)'];
  ws.getRow(row).font = { italic: true };
  row++;
  const konfRow = row;
  ws.getRow(row).values = ['Montage + Verpackung je Set', null, null, { formula: `(B${row}/60)*C${row}` }];
  row++;

  row++; // Leerzeile
  const versandRow = row;
  ws.getRow(row).values = ['Versand (Verpackung + Porto)', null, null, null];
  row++;

  row++; // Leerzeile
  const sumHerstellkostenRow = row;
  ws.getRow(row).values = [
    'Summe Herstellkosten',
    null,
    null,
    { formula: `D${sumWareneinsatzRow}+D${konfRow}+D${versandRow}` },
  ];
  ws.getRow(row).font = { bold: true };
  row++;

  row++; // Leerzeile
  const vkRow = row;
  ws.getRow(row).values = ['Geplanter Verkaufspreis (netto, EUR)', null, null, null];
  row++;

  const dbRow = row;
  ws.getRow(row).values = [
    'Deckungsbeitrag vor Marketing (EUR)',
    null,
    null,
    { formula: `D${vkRow}-D${sumHerstellkostenRow}` },
  ];
  ws.getRow(row).font = { bold: true };
  row++;

  const dbPctRow = row;
  ws.getRow(row).values = [
    'Deckungsbeitrag vor Marketing (%)',
    null,
    null,
    { formula: `IF(D${vkRow}=0,"",D${dbRow}/D${vkRow})` },
  ];
  ws.getRow(dbPctRow).getCell(4).numFmt = '0.0%';
  row++;

  row++; // Leerzeile
  ws.getRow(row).values = ['Hinweis: Alle Zahlenfelder sind bewusst leer. Nur echte, bestaetigte Werte eintragen -- keine Schaetzungen.'];
  ws.getRow(row).font = { italic: true, color: { argb: 'FF888888' } };

  ws.getColumn(4).numFmt = '#,##0.00 €';
  ws.getColumn(2).numFmt = '#,##0.00 €';

  await wb.xlsx.writeFile(__dirname + '/kalkulation-the-invitation.xlsx');
  console.log('Kalkulationsvorlage geschrieben:', __dirname + '/kalkulation-the-invitation.xlsx');
}

main().catch(e => { console.error('ERR', e); process.exit(1); });
