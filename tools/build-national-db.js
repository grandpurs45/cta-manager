#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = { input: null, output: "packs/fr", country: "FR" };
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--input") args.input = argv[++i];
    else if (token === "--output") args.output = argv[++i];
    else if (token === "--country") args.country = argv[++i];
  }
  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeRow(row) {
  const dep = String(row?.dep || row?.departmentCode || "").padStart(2, "0");
  const nom = row?.nom || row?.name || row?.commune;
  const insee = row?.insee || row?.code || row?.id;
  const lat = Number(row?.lat);
  const lon = Number(row?.lon);
  const population = Number(row?.population);

  if (!dep || !nom || !insee || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  return {
    dep,
    insee: String(insee),
    nom: String(nom),
    lat,
    lon,
    population: Number.isFinite(population) && population > 0 ? Math.round(population) : 300
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.input) {
    console.error("Usage: node tools/build-national-db.js --input <file.json> [--output packs/fr] [--country FR]");
    process.exit(1);
  }

  const inputPath = path.resolve(args.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Input introuvable: ${inputPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, "utf8");
  const parsed = JSON.parse(raw);
  const rows = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.communes) ? parsed.communes : []);
  const normalized = rows.map(normalizeRow).filter(Boolean);

  if (normalized.length === 0) {
    console.error("Aucune commune valide dans l'input.");
    process.exit(1);
  }

  const byDep = new Map();
  normalized.forEach(item => {
    if (!byDep.has(item.dep)) byDep.set(item.dep, []);
    byDep.get(item.dep).push(item);
  });

  const outputRoot = path.resolve(args.output);
  ensureDir(outputRoot);
  ensureDir(path.join(outputRoot, "departements"));

  const departments = [];

  Array.from(byDep.keys()).sort().forEach(depCode => {
    const communes = byDep.get(depCode)
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr-FR"))
      .map(item => ({
        insee: item.insee,
        nom: item.nom,
        lat: item.lat,
        lon: item.lon,
        population: item.population
      }));

    const depDir = path.join(outputRoot, "departements", depCode);
    ensureDir(depDir);

    const payload = {
      country: args.country,
      departmentCode: depCode,
      label: `Departement ${depCode}`,
      communes
    };

    fs.writeFileSync(
      path.join(depDir, "communes.json"),
      JSON.stringify(payload, null, 2),
      "utf8"
    );

    departments.push({
      code: depCode,
      label: `Departement ${depCode}`,
      count: communes.length
    });
  });

  const indexPayload = {
    country: args.country,
    version: new Date().toISOString().slice(0, 10),
    departments
  };

  fs.writeFileSync(
    path.join(outputRoot, "index.json"),
    JSON.stringify(indexPayload, null, 2),
    "utf8"
  );

  console.log(`OK: ${normalized.length} communes -> ${departments.length} departements`);
}

main();
