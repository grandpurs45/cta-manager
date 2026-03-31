/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

async function getJson(url) {
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on ${url}`);
  }
  return res.json();
}

function parseArgs(argv) {
  const args = {
    out: "tools/sources/communes-fr.generated.json",
    onlyDep: null
  };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--out") args.out = argv[++i];
    else if (token === "--dep") args.onlyDep = argv[++i];
  }

  return args;
}

function normalizeCommune(row) {
  const centre = row?.centre?.coordinates;
  if (!Array.isArray(centre) || centre.length < 2) {
    return null;
  }

  const lon = Number(centre[0]);
  const lat = Number(centre[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  const dep = String(row.codeDepartement || "").padStart(2, "0");
  const insee = String(row.code || "");
  const nom = row.nom || "";
  const population = Number(row.population);

  if (!dep || !insee || !nom) {
    return null;
  }

  return {
    dep,
    insee,
    nom,
    lat,
    lon,
    population: Number.isFinite(population) && population > 0 ? Math.round(population) : 300
  };
}

async function main() {
  const args = parseArgs(process.argv);

  const depListRaw = await getJson("https://geo.api.gouv.fr/departements?fields=code,nom");
  const depList = Array.isArray(depListRaw) ? depListRaw : [];

  const deps = args.onlyDep
    ? depList.filter(d => String(d.code) === String(args.onlyDep))
    : depList;

  if (deps.length === 0) {
    throw new Error("Aucun departement trouve.");
  }

  const rows = [];

  for (const dep of deps) {
    const code = String(dep.code);
    const url = `https://geo.api.gouv.fr/departements/${code}/communes?fields=code,nom,codeDepartement,population,centre&format=json`;
    console.log(`Fetch dep ${code}...`);
    const communesRaw = await getJson(url);
    const communes = Array.isArray(communesRaw) ? communesRaw : [];

    communes.forEach(item => {
      const normalized = normalizeCommune(item);
      if (normalized) rows.push(normalized);
    });
  }

  const outPath = path.resolve(args.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), "utf8");

  console.log(`OK: ${rows.length} communes ecrites dans ${outPath}`);
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
