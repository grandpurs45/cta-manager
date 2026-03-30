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

  const defaultUnlockedVehicleTypes = legacyMode
    ? allVehicleTypes
    : Array.from(new Set(
      VEHICULES
        .filter(vehicle => defaultOwnedVehicles.includes(vehicle.id))
        .map(vehicle => vehicle.type)
    ));

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
    ownedVehicleIds: defaultOwnedVehicles,
    unlockedVehicleTypes: defaultUnlockedVehicleTypes.length > 0 ? defaultUnlockedVehicleTypes : ["VSAV"],
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

    if (unlockedFromOwned.size === 0) {
      unlockedFromOwned.add("VSAV");
    }

    progression.unlockedVehicleTypes = Array.from(unlockedFromOwned);
  }

  return progression;
}

function createInstallationState() {
  const defaultMode = SETTINGS.installation?.defaultMode;

  return {
    mode: normalizeInstallationMode(defaultMode),
    isFirstLaunch: false
  };
}

function ensureInstallationStateShape(loadedInstallation) {
  const base = createInstallationState();
  const installation = loadedInstallation || {};

  installation.mode = normalizeInstallationMode(installation.mode || base.mode);
  installation.isFirstLaunch = typeof installation.isFirstLaunch === "boolean"
    ? installation.isFirstLaunch
    : base.isFirstLaunch;

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
  const installationMode = state?.installation?.mode || "offline";
  const modeLabel = installationMode === "online" ? "mode online" : "mode offline local";
  document.title = `${APP_META.name} ${APP_META.version}`;

  if (titleEl) {
    titleEl.textContent = `${APP_META.name} ${APP_META.version}`;
  }

  if (versionEl) {
    versionEl.textContent = `${APP_META.version} - ${modeLabel}`;
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

renderAppMeta();
renderAll();

setInterval(() => {
  if (!state.isPaused) {
    advanceSimulation();
  }
}, SETTINGS.simulation.tickMs);
