const STORAGE_KEY = `cta-manager-lite-${APP_META.version}`;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeInstallationMode(mode) {
  return mode === "online" ? "online" : "offline";
}

if (typeof CASERNES === "undefined") {
  alert("Erreur : le fichier data/casernes.js n'est pas chargé.");
  throw new Error("CASERNES non chargé");
}

if (typeof VEHICULES === "undefined") {
  alert("Erreur : le fichier data/vehicules.js n'est pas chargé.");
  throw new Error("VEHICULES non chargé");
}

if (typeof ZONES === "undefined") {
  alert("Erreur : le fichier data/zones.js n'est pas chargé.");
  throw new Error("ZONES non chargé");
}

if (typeof INTERVENTION_TEMPLATES === "undefined") {
  alert("Erreur : le fichier data/interventions.js n'est pas chargé.");
  throw new Error("INTERVENTION_TEMPLATES non chargé");
}

if (typeof VEHICULE_TYPES === "undefined") {
  alert("Erreur : le fichier data/vehicule-types.js n'est pas chargé.");
  throw new Error("VEHICULE_TYPES non chargé");
}

if (typeof SETTINGS === "undefined") {
  alert("Erreur : le fichier data/settings.js n'est pas chargé.");
  throw new Error("SETTINGS non chargé");
}

if (typeof HOPITAUX === "undefined") {
  alert("Erreur : le fichier data/hopitaux.js n'est pas chargé.");
  throw new Error("HOPITAUX non chargé");
}

if (typeof VEHICLE_STATUS === "undefined") {
  alert("Erreur : le fichier data/vehicle-status.js n'est pas chargé.");
  throw new Error("VEHICLE_STATUS non chargé");
}

function initializeCasernes(casernes) {
  return clone(casernes).map(caserne => {
    if (caserne.effectifs) {
      if (caserne.effectifs.poste) {
        if (typeof caserne.effectifs.poste.current !== "number") {
          caserne.effectifs.poste.current = caserne.effectifs.poste.max;
        }
        caserne.sp_poste = caserne.effectifs.poste.current;
      }

      if (caserne.effectifs.astreinte) {
        if (typeof caserne.effectifs.astreinte.current !== "number") {
          caserne.effectifs.astreinte.current = caserne.effectifs.astreinte.max;
        }
        caserne.sp_astreinte = caserne.effectifs.astreinte.current;
      }
    }

    return caserne;
  });
}

function createProgressionState({ legacyMode = false } = {}) {
  const progressionConfig = SETTINGS.progression || {};
  const allVehicleTypes = Object.keys(VEHICULE_TYPES || {});
  const defaultOwnedCasernes = legacyMode
    ? CASERNES.map(caserne => caserne.id)
    : [progressionConfig.startingCaserneId || CASERNES[0]?.id].filter(Boolean);

  const defaultOwnedVehicles = legacyMode
    ? VEHICULES.map(vehicle => vehicle.id)
    : (progressionConfig.startingVehicleIds || []).slice();

  const unlockedFromVehicles = Array.from(new Set(
    VEHICULES
      .filter(vehicle => defaultOwnedVehicles.includes(vehicle.id))
      .map(vehicle => vehicle.type)
  ));
  const configuredUnlockedTypes = Array.isArray(progressionConfig.startingUnlockedVehicleTypes)
    ? progressionConfig.startingUnlockedVehicleTypes.filter(type => !!VEHICULE_TYPES[type])
    : [];
  const defaultUnlockedVehicleTypes = legacyMode
    ? allVehicleTypes
    : Array.from(new Set([...configuredUnlockedTypes, ...unlockedFromVehicles]));
  const defaultCaserneLevels = defaultOwnedCasernes.reduce((acc, caserneId) => {
    acc[caserneId] = 1;
    return acc;
  }, {});

  return {
    enabled: progressionConfig.enabled !== false,
    money: progressionConfig.startingMoney || 0,
    completedInterventions: 0,
    totalRevenue: 0,
    totalQualityBonus: 0,
    totalQualityPenalty: 0,
    qualityTotalScore: 0,
    qualityRunCount: 0,
    bestQualityScore: null,
    worstQualityScore: null,
    ownedCaserneIds: defaultOwnedCasernes,
    caserneLevels: defaultCaserneLevels,
    ownedVehicleIds: defaultOwnedVehicles,
    unlockedVehicleTypes: defaultUnlockedVehicleTypes.length > 0 ? defaultUnlockedVehicleTypes : [],
    vehiclePurchaseCounters: {},
    unlockedFeatures: {
      hospitalTransport: false,
      adminFleet: false
    },
    lastReward: null,
    rewardHistory: []
  };
}

function ensureProgressionStateShape(loadedProgression) {
  const base = createProgressionState();
  const progression = loadedProgression || {};

  progression.enabled = progression.enabled !== false;
  progression.money = typeof progression.money === "number" ? progression.money : base.money;
  progression.completedInterventions = typeof progression.completedInterventions === "number"
    ? progression.completedInterventions
    : base.completedInterventions;
  progression.totalRevenue = typeof progression.totalRevenue === "number"
    ? progression.totalRevenue
    : base.totalRevenue;
  progression.totalQualityBonus = typeof progression.totalQualityBonus === "number"
    ? progression.totalQualityBonus
    : base.totalQualityBonus;
  progression.totalQualityPenalty = typeof progression.totalQualityPenalty === "number"
    ? progression.totalQualityPenalty
    : base.totalQualityPenalty;
  progression.qualityTotalScore = typeof progression.qualityTotalScore === "number"
    ? progression.qualityTotalScore
    : base.qualityTotalScore;
  progression.qualityRunCount = typeof progression.qualityRunCount === "number"
    ? progression.qualityRunCount
    : base.qualityRunCount;
  progression.bestQualityScore = typeof progression.bestQualityScore === "number"
    ? progression.bestQualityScore
    : base.bestQualityScore;
  progression.worstQualityScore = typeof progression.worstQualityScore === "number"
    ? progression.worstQualityScore
    : base.worstQualityScore;
  progression.ownedCaserneIds = Array.isArray(progression.ownedCaserneIds)
    ? progression.ownedCaserneIds
    : base.ownedCaserneIds;
  progression.caserneLevels =
    progression.caserneLevels && typeof progression.caserneLevels === "object"
      ? progression.caserneLevels
      : {};
  progression.ownedVehicleIds = Array.isArray(progression.ownedVehicleIds)
    ? progression.ownedVehicleIds
    : base.ownedVehicleIds;
  progression.unlockedVehicleTypes = Array.isArray(progression.unlockedVehicleTypes)
    ? progression.unlockedVehicleTypes
    : [];
  progression.vehiclePurchaseCounters =
    progression.vehiclePurchaseCounters && typeof progression.vehiclePurchaseCounters === "object"
      ? progression.vehiclePurchaseCounters
      : {};
  progression.unlockedFeatures = {
    hospitalTransport: !!progression.unlockedFeatures?.hospitalTransport,
    adminFleet: !!progression.unlockedFeatures?.adminFleet
  };
  progression.lastReward = progression.lastReward || null;
  progression.rewardHistory = Array.isArray(progression.rewardHistory)
    ? progression.rewardHistory
    : [];

  if (progression.unlockedVehicleTypes.length === 0) {
    const unlockedFromOwned = new Set(
      VEHICULES
        .filter(vehicle => progression.ownedVehicleIds.includes(vehicle.id))
        .map(vehicle => vehicle.type)
    );

    progression.unlockedVehicleTypes = Array.from(unlockedFromOwned);
  }

  progression.ownedCaserneIds.forEach(caserneId => {
    const currentLevel = Number(progression.caserneLevels[caserneId]);
    progression.caserneLevels[caserneId] = Number.isFinite(currentLevel) && currentLevel >= 1
      ? Math.floor(currentLevel)
      : 1;
  });

  return progression;
}

function createInstallationState() {
  const defaultMode = SETTINGS.installation?.defaultMode;
  const defaultDepartmentCode = SETTINGS.installation?.defaultDepartmentCode || null;

  return {
    mode: normalizeInstallationMode(defaultMode),
    isFirstLaunch: true,
    territory: {
      country: "FR",
      departmentCode: defaultDepartmentCode,
      label: null
    }
  };
}

function ensureInstallationStateShape(loadedInstallation) {
  const base = createInstallationState();
  const installation = loadedInstallation || {};

  installation.mode = normalizeInstallationMode(installation.mode || base.mode);
  installation.isFirstLaunch = typeof installation.isFirstLaunch === "boolean"
    ? installation.isFirstLaunch
    : base.isFirstLaunch;
  installation.territory = {
    country: installation.territory?.country || base.territory.country,
    departmentCode: installation.territory?.departmentCode || base.territory.departmentCode,
    label: installation.territory?.label || base.territory.label
  };

  return installation;
}


function createInitialState() {
  return {
    simulationMinutes: 8 * 60,
    selectedInterventionId: null,
    nextInterventionId: 1,
    currentCenterPanel: "detail",
    currentAdminPanel: null,
    casernes: initializeCasernes(CASERNES),
    nextStaffingUpdateMinutes: (8 * 60) + (SETTINGS.staffing.updateIntervalHours * 60),
    vehicules: clone(VEHICULES).map(vehicle => ({
      ...vehicle,
      status: "DISPO",
      etat: "disponible"
    })),
    interventions: [],
    dynamicZones: null,
    activeMissions: [],
    dispatchSelections: {},
    isPaused: false,
    installation: createInstallationState(),
    progression: createProgressionState()
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return createInitialState();
  }

  try {
    const loadedState = JSON.parse(raw);

    if (!loadedState.dispatchSelections) {
      loadedState.dispatchSelections = {};
    }
    if (!Array.isArray(loadedState.dynamicZones)) {
      loadedState.dynamicZones = null;
    }

    if (!loadedState.progression) {
      loadedState.progression = createProgressionState({ legacyMode: true });
    } else {
      loadedState.progression = ensureProgressionStateShape(loadedState.progression);
    }

    if (!loadedState.installation) {
      loadedState.installation = createInstallationState();
    } else {
      loadedState.installation = ensureInstallationStateShape(loadedState.installation);
    }

    if (typeof loadedState.isPaused !== "boolean") {
      loadedState.isPaused = false;
    }
    if (typeof loadedState.currentCenterPanel !== "string") {
      loadedState.currentCenterPanel = "detail";
    }
    if (typeof loadedState.currentAdminPanel !== "string" && loadedState.currentAdminPanel !== null) {
      loadedState.currentAdminPanel = null;
    }
    if (typeof loadedState.nextStaffingUpdateMinutes !== "number") {
      loadedState.nextStaffingUpdateMinutes =
        loadedState.simulationMinutes + (SETTINGS.staffing.updateIntervalHours * 60);
    }

    if (Array.isArray(loadedState.casernes)) {
      loadedState.casernes = loadedState.casernes.map(caserne => {
        if (caserne.effectifs) {
          if (caserne.effectifs.poste && typeof caserne.effectifs.poste.current === "number") {
            caserne.sp_poste = caserne.effectifs.poste.current;
          }

          if (caserne.effectifs.astreinte && typeof caserne.effectifs.astreinte.current === "number") {
            caserne.sp_astreinte = caserne.effectifs.astreinte.current;
          }
        }

        return caserne;
      });
    }
    if (Array.isArray(loadedState.vehicules)) {
      loadedState.vehicules = loadedState.vehicules.map(vehicle => ({
        ...vehicle,
        status: vehicle.status || "DISPO"
      }));
    }

    if (Array.isArray(loadedState.interventions)) {
      loadedState.interventions = loadedState.interventions.map(intervention => ({
        ...intervention,
        status: intervention.status || "ALERTE",
        isActive: !!intervention.isActive
      }));
    }

    return loadedState;
  } catch (error) {
    return createInitialState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetGame() {
  if (!confirm("Réinitialiser complètement la partie ?")) {
    return;
  }

  state = createInitialState();
  saveState();
  renderAll();
}

function selectIntervention(interventionId) {
  state.selectedInterventionId = interventionId;
  saveState();
  renderAll();
}

function togglePause() {
  state.isPaused = !state.isPaused;
  saveState();
  renderAll();
}

function renderAppMeta() {
  const titleEl = document.getElementById("appTitle");
  const versionEl = document.getElementById("appVersionLine");
  document.title = `${APP_META.name} ${APP_META.version}`;

  if (titleEl) {
    titleEl.textContent = `${APP_META.name} ${APP_META.version}`;
  }

  if (versionEl) {
    versionEl.textContent = `${APP_META.version}`;
  }
}

let territoryCatalog = [];
let territoryCatalogLoading = false;

function slugifyZoneId(value) {
  const safe = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return safe || `ZONE_${Math.floor(Math.random() * 100000)}`;
}

function getDefaultStartingCaserneId() {
  const configured = SETTINGS?.progression?.startingCaserneId;
  if (configured && CASERNES.some(caserne => caserne.id === configured)) {
    return configured;
  }

  return CASERNES[0]?.id || null;
}

function createStartingVipVehicle(caserneId) {
  const existingVip = state.vehicules.find(vehicle =>
    vehicle.type === "VIP" && vehicle.caserneId === caserneId
  );
  if (existingVip) {
    existingVip.status = "DISPO";
    existingVip.etat = "disponible";
    return existingVip.id;
  }

  let nextCounter = 1;
  let id = `START_VIP_${String(nextCounter).padStart(3, "0")}`;
  while (state.vehicules.some(vehicle => vehicle.id === id)) {
    nextCounter += 1;
    id = `START_VIP_${String(nextCounter).padStart(3, "0")}`;
  }

  const suffix = String(nextCounter).padStart(3, "0");
  const vehicle = {
    id,
    nom: `VIP ${suffix}`,
    type: "VIP",
    caserneId,
    status: "DISPO",
    etat: "disponible"
  };

  state.vehicules.push(vehicle);
  return vehicle.id;
}

function initializeNewCareerForStartingCaserne(startingCaserneId) {
  const fallbackCaserneId = getDefaultStartingCaserneId();
  const validCaserneId = CASERNES.some(caserne => caserne.id === startingCaserneId)
    ? startingCaserneId
    : fallbackCaserneId;

  if (!validCaserneId) {
    return;
  }

  state.simulationMinutes = 8 * 60;
  state.selectedInterventionId = null;
  state.nextInterventionId = 1;
  state.currentCenterPanel = "detail";
  state.currentAdminPanel = null;
  state.dispatchSelections = {};
  state.interventions = [];
  state.activeMissions = [];
  state.isPaused = false;
  state.nextStaffingUpdateMinutes = (8 * 60) + (SETTINGS.staffing.updateIntervalHours * 60);
  state.casernes = initializeCasernes(CASERNES);
  state.vehicules = clone(VEHICULES).map(vehicle => ({
    ...vehicle,
    status: "DISPO",
    etat: "disponible"
  }));

  const startingVehicleId = createStartingVipVehicle(validCaserneId);
  state.progression = createProgressionState();
  state.progression.money = SETTINGS.progression?.startingMoney || 0;
  state.progression.completedInterventions = 0;
  state.progression.totalRevenue = 0;
  state.progression.totalQualityBonus = 0;
  state.progression.totalQualityPenalty = 0;
  state.progression.qualityTotalScore = 0;
  state.progression.qualityRunCount = 0;
  state.progression.bestQualityScore = null;
  state.progression.worstQualityScore = null;
  state.progression.ownedCaserneIds = [validCaserneId];
  state.progression.caserneLevels = { [validCaserneId]: 1 };
  state.progression.ownedVehicleIds = [startingVehicleId];
  state.progression.unlockedVehicleTypes = ["VIP"];
  state.progression.vehiclePurchaseCounters = {};
  state.progression.unlockedFeatures = {
    hospitalTransport: false,
    adminFleet: false
  };
  state.progression.lastReward = null;
  state.progression.rewardHistory = [];
}

function communeToZone(commune) {
  const lat = Number(commune?.lat);
  const lon = Number(commune?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  const population = Number(commune?.population);
  const safePopulation = Number.isFinite(population) && population > 0 ? Math.round(population) : 300;
  const idSource = commune?.insee || commune?.code || commune?.id || commune?.nom;

  return {
    id: slugifyZoneId(idSource),
    nom: commune?.nom || `Commune ${idSource || ""}`.trim(),
    lat,
    lon,
    population: safePopulation,
    poidsIntervention: Math.max(0.2, safePopulation / 1000)
  };
}

function getCurrentTerritoryLabel() {
  const territory = state?.installation?.territory || {};
  const departmentCode = territory.departmentCode;
  if (!departmentCode) {
    return "Territoire non configure";
  }

  const inCatalog = territoryCatalog.find(item => item.code === departmentCode);
  const label = territory.label || inCatalog?.label || departmentCode;
  return `FR-${departmentCode} (${label})`;
}

async function loadTerritoryCatalog() {
  if (territoryCatalogLoading) {
    return territoryCatalog;
  }

  territoryCatalogLoading = true;
  try {
    const response = await fetch("packs/fr/index.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const departments = Array.isArray(payload?.departments) ? payload.departments : [];
    territoryCatalog = departments
      .filter(item => item && item.code)
      .map(item => ({
        code: String(item.code),
        label: item.label || String(item.code),
        count: typeof item.count === "number" ? item.count : null
      }))
      .sort((a, b) => a.code.localeCompare(b.code, "fr-FR"));
  } catch (error) {
    territoryCatalog = [];
    console.error("Impossible de charger l'index des packs territoires:", error);
  } finally {
    territoryCatalogLoading = false;
  }

  return territoryCatalog;
}

async function applyDepartmentSelection(departmentCode, startingCaserneId = null) {
  const normalizedCode = String(departmentCode || "").trim();
  if (!normalizedCode) {
    alert("Choisis un departement.");
    return false;
  }

  try {
    const response = await fetch(`packs/fr/departements/${normalizedCode}/communes.json`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const communes = Array.isArray(payload?.communes) ? payload.communes : [];
    const zones = communes.map(communeToZone).filter(Boolean);

    if (zones.length === 0) {
      alert("Le pack selectionne ne contient pas de communes exploitables.");
      return false;
    }

    const catalogItem = territoryCatalog.find(item => item.code === normalizedCode);
    state.dynamicZones = zones;
    if (state.installation?.isFirstLaunch) {
      initializeNewCareerForStartingCaserne(startingCaserneId || getDefaultStartingCaserneId());
    }
    state.installation.territory = {
      country: "FR",
      departmentCode: normalizedCode,
      label: catalogItem?.label || payload?.label || normalizedCode
    };
    state.installation.isFirstLaunch = false;
    state.currentCenterPanel = "detail";
    state.selectedInterventionId = null;
    state.isPaused = false;

    saveState();
    renderAppMeta();
    renderAll();
    return true;
  } catch (error) {
    console.error("Chargement du pack departement impossible:", error);
    alert(`Impossible de charger le pack du departement ${normalizedCode}.`);
    return false;
  }
}

async function ensureTerritoryReady() {
  const territory = state?.installation?.territory || {};
  const hasDepartment = !!territory.departmentCode;

  await loadTerritoryCatalog();

  if (!hasDepartment) {
    if (territoryCatalog.length === 0) {
      // Fallback mode (ex: ouverture directe en file:// sans serveur HTTP).
      // On ne bloque pas le jeu: on garde les zones statiques.
      state.installation.isFirstLaunch = false;
      state.currentCenterPanel = "detail";
      state.isPaused = false;
      saveState();
      renderAll();
      return;
    }

    state.currentCenterPanel = "territorySetup";
    state.isPaused = true;
    saveState();
    renderAll();
    return;
  }

  if (Array.isArray(state.dynamicZones) && state.dynamicZones.length > 0) {
    return;
  }

  const loaded = await applyDepartmentSelection(territory.departmentCode);
  if (!loaded) {
    if (territoryCatalog.length === 0) {
      // Fallback statique si aucun pack n'est chargeable.
      state.currentCenterPanel = "detail";
      state.isPaused = false;
      saveState();
      renderAll();
      return;
    }

    state.currentCenterPanel = "territorySetup";
    state.isPaused = true;
    saveState();
    renderAll();
  }
}

let state = loadState();

document.getElementById("btnGenerate").addEventListener("click", generateIntervention);
document.getElementById("btnReset").addEventListener("click", resetGame);
document.getElementById("btnPause").addEventListener("click", togglePause);

window.selectIntervention = selectIntervention;
window.engageSolution = engageSolution;
window.addVehicleToSelection = addVehicleToSelection;
window.deleteVehicule = deleteVehicule;
window.removeVehicleFromSelection = removeVehicleFromSelection;
window.clearDispatchSelection = clearDispatchSelection;
window.engageSelection = engageSelection;
window.getInstallationMode = () => state?.installation?.mode || "offline";
window.getTerritoryCatalog = () => territoryCatalog;
window.getCurrentTerritoryLabel = getCurrentTerritoryLabel;
window.applyDepartmentSelection = applyDepartmentSelection;
window.reloadTerritoryCatalog = async () => {
  territoryCatalog = [];
  return loadTerritoryCatalog();
};

renderAppMeta();
renderAll();
ensureTerritoryReady();

setInterval(() => {
  if (!state.isPaused) {
    advanceSimulation();
  }
}, SETTINGS.simulation.tickMs);
