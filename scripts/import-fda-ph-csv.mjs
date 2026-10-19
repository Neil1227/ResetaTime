#!/usr/bin/env node
/**
 * FDA Philippines Drug Registry CSV -> ResetaTime PH JSON Importer
 * Usage: node scripts/import-fda-ph-csv.mjs path/to/fda-ph-drugs.csv
 */
import fs from 'node:fs';
import path from 'node:path';

const csvPath = process.argv[2];
if (!csvPath) {
  console.log('Usage: node scripts/import-fda-ph-csv.mjs <path-to-fda-ph-export.csv>');
  console.log('Converts an official FDA Philippines Verification Portal CSV into src/data/fdaPhImported.json');
  process.exit(0);
}

const raw = fs.readFileSync(path.resolve(csvPath), 'utf8');
const lines = raw.split(/\r?\n/).filter(Boolean);
const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

const records = lines.slice(1).map((line, idx) => {
  const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
  const row = Object.fromEntries(headers.map((h, i) => [h, cols[i] || '']));
  return {
    id: `fda-csv-${idx + 1}`,
    fdaRegNo: row['registration number'] || row['reg_no'] || '',
    genericName: row['generic name'] || row['generic_name'] || 'Unknown Generic',
    brandName: row['brand name'] || row['brand_name'] || row['generic name'] || 'Generic',
    strength: row['dosage strength'] || row['strength'] || '',
    form: row['dosage form'] || row['form'] || 'Tablet',
    classification: (row['classification'] || '').toLowerCase().includes('over') ? 'OTC' : 'Rx',
    category: row['pharmacologic category'] || 'FDA PH Registered Drug'
  };
});

const outPath = path.resolve('src/data/fdaPhImported.json');
fs.writeFileSync(outPath, JSON.stringify(records, null, 2), 'utf8');
console.log(`✅ Imported ${records.length} FDA PH drug records to ${outPath}`);
