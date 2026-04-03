function formatTime(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function calculateUsedSP(caserneId) {
  const activeMissionSp = state.activeMissions
    .filter(mission => mission.caserneId === caserneId && mission.phase !== "terminee")
    .reduce((sum, mission) => sum + mission.spRequired, 0);

  const returningDetachedSp = state.vehicules
    .filter(vehicle =>
      vehicle.caserneId === caserneId &&
      typeof vehicle.returnToBaseRemaining === "number" &&
      vehicle.returnToBaseRemaining > 0
    )
    .reduce((sum, vehicle) => sum + (Number(vehicle.returnToBaseSp) || 0), 0);

  return activeMissionSp + returningDetachedSp;
}

function getCaserneById(id) {
  return state.casernes.find(caserne => caserne.id === id) || null;
}

function getVehicleById(id) {
  return state.vehicules.find(vehicle => vehicle.id === id) || null;
}

function getProgressionState() {
  return state.progression || null;
}

function getProgressionConfig() {
  const base = SETTINGS.progression || {};
  const eco = (typeof ECONOMY !== "undefined" && ECONOMY?.progression) ? ECONOMY.progression : {};

  return {
    ...base,
    ...eco,
    rewards: {
      ...(base.rewards || {}),
      ...(eco.rewards || {})
    },
    quality: {
      ...(base.quality || {}),
      ...(eco.quality || {})
    },
    caserneLevel1Staffing: {
      ...(base.caserneLevel1Staffing || {}),
      ...(eco.caserneLevel1Staffing || {})
    },
    caserneLevels: {
      ...(base.caserneLevels || {}),
      ...(eco.caserneLevels || {})
    },
    unlockCosts: {
      ...(base.unlockCosts || {}),
      ...(eco.unlockCosts || {}),
      features: {
        ...(base.unlockCosts?.features || {}),
        ...(eco.unlockCosts?.features || {})
      },
      vehicleTypeUnlock: {
        ...(base.unlockCosts?.vehicleTypeUnlock || {}),
        ...(eco.unlockCosts?.vehicleTypeUnlock || {})
      },
      casernes: {
        ...(base.unlockCosts?.casernes || {}),
        ...(eco.unlockCosts?.casernes || {})
      },
      postedGuard: {
        ...(base.unlockCosts?.postedGuard || {}),
        ...(eco.unlockCosts?.postedGuard || {})
      },
      staffingUnits: {
        ...(base.unlockCosts?.staffingUnits || {}),
        ...(eco.unlockCosts?.staffingUnits || {})
      },
      vehicleByType: {
        ...(base.unlockCosts?.vehicleByType || {}),
        ...(eco.unlockCosts?.vehicleByType || {})
      }
    }
  };
}

function isProgressionEnabled() {
  const progression = getProgressionState();
  return !!(progression && progression.enabled);
}

function isCaserneOwned(caserneId) {
  const progression = getProgressionState();
  if (!isProgressionEnabled()) {
    return true;
  }

  return progression.ownedCaserneIds.includes(caserneId);
}

function getCaserneLevel(caserneId) {
  if (!caserneId) {
    return 0;
  }

  const progression = getProgressionState();
  if (!isProgressionEnabled() || !progression) {
    return 1;
  }

  if (!isCaserneOwned(caserneId)) {
    return 0;
  }

  const level = Number(progression.caserneLevels?.[caserneId]);
  return Number.isFinite(level) && level >= 1 ? Math.floor(level) : 1;
}

function isVehicleOwned(vehicleId) {
  const progression = getProgressionState();
  if (!isProgressionEnabled()) {
    return true;
  }

  return progression.ownedVehicleIds.includes(vehicleId);
}

function isVehicleTypeUnlocked(type) {
  const progression = getProgressionState();
  if (!isProgressionEnabled()) {
    return true;
  }

  return progression.unlockedVehicleTypes.includes(type);
}

function canUseVehicle(vehicle) {
  if (!vehicle) {
    return false;
  }

  return isVehicleOwned(vehicle.id) &&
    isCaserneOwned(vehicle.caserneId) &&
    isVehicleTypeUnlocked(vehicle.type);
}

function getOwnedCasernes() {
  return state.casernes.filter(caserne => isCaserneOwned(caserne.id));
}

function getOwnedVehicles() {
  return state.vehicules.filter(vehicle => canUseVehicle(vehicle));
}

function hasFeatureUnlocked(featureKey) {
  const progression = getProgressionState();
  if (!isProgressionEnabled()) {
    return true;
  }

  return !!progression.unlockedFeatures?.[featureKey];
}

function isVehicleAvailable(vehicle) {
  return !!vehicle &&
    canUseVehicle(vehicle) &&
    (vehicle.etat === "disponible" || vehicle.etat === "retour") &&
    !isVehicleReserved(vehicle.id);
}

function getInterventionById(id) {
  return state.interventions.find(intervention => intervention.id === id) || null;
}

function getActiveZones() {
  if (Array.isArray(state?.dynamicZones) && state.dynamicZones.length > 0) {
    return state.dynamicZones;
  }

  return ZONES;
}

function getInterventionStatusLabel(status) {
  switch (status) {
    case "ALERTE":
      return "Alerte";
    case "ENGAGEMENT_PARTIEL":
      return "Engagement partiel";
    case "ENGAGEMENT_COMPLET":
      return "Engagement complet";
    case "RENFORT_EN_COURS":
      return "Renfort en cours";
    case "TERMINEE":
      return "Terminée";
    default:
      return status || "Inconnu";
  }
}

function setInterventionStatus(intervention, status) {
  if (!intervention) {
    return;
  }

  intervention.status = status;
}

function refreshInterventionStatus(interventionId) {
  const intervention = getInterventionById(interventionId);

  if (!intervention) {
    return;
  }

  const selection = getDispatchSelection(interventionId);
  const selectedItems = getSelectedItemsForIntervention(interventionId);
  const engagements = selectedItems.map(buildEngagementFromProfileItem);

  const coverageSummary = getCoverageSummary(intervention, engagements);

  if (!selection || selection.length === 0) {
    setInterventionStatus(intervention, "ALERTE");
    return;
  }

  if (coverageSummary.covered) {
    setInterventionStatus(intervention, "ENGAGEMENT_COMPLET");
    return;
  }

  setInterventionStatus(intervention, "ENGAGEMENT_PARTIEL");
}

function getZoneById(id) {
  return getActiveZones().find(zone => zone.id === id) || null;
}

function getVehicleTypeConfig(type) {
  return VEHICULE_TYPES[type] || null;
}

function getFleetCodeAvailability() {
  const availability = {};
  const ownedVehicles = getOwnedVehicles();

  ownedVehicles.forEach(vehicle => {
    const typeConfig = getVehicleTypeConfig(vehicle.type);
    if (!typeConfig || !Array.isArray(typeConfig.profils)) {
      return;
    }

    const supportedCodes = new Set();
    typeConfig.profils.forEach(profil => {
      const normalized = normalizeProfilCode(profil);
      const baseCode = profil.code;
      supportedCodes.add(normalized);
      supportedCodes.add(baseCode);
    });

    supportedCodes.forEach(code => {
      availability[code] = (availability[code] || 0) + 1;
    });
  });

  return availability;
}

function canFleetSatisfyNeed(need, codeAvailability) {
  if (!need || !need.code) {
    return false;
  }

  const requiredQty = need.quantite || 1;
  const directCount = codeAvailability[need.code] || 0;
  if (directCount >= requiredQty) {
    return true;
  }

  const rules = COVERAGE_RULES?.[need.code] || [];
  return rules.some(rule =>
    (rule.requires || []).every(requirement => {
      const required = (requirement.quantite || 1) * requiredQty;
      return (codeAvailability[requirement.code] || 0) >= required;
    })
  );
}

function canFleetHandleTemplate(template) {
  if (!template || !Array.isArray(template.besoins) || template.besoins.length === 0) {
    return false;
  }

  const codeAvailability = getFleetCodeAvailability();
  return template.besoins.every(need => canFleetSatisfyNeed(need, codeAvailability));
}

function pickWeightedInterventionTemplate() {
  const allTemplates = INTERVENTION_TEMPLATES || [];
  const eligibleTemplates = isProgressionEnabled()
    ? allTemplates.filter(canFleetHandleTemplate)
    : allTemplates;

  const source = isProgressionEnabled()
    ? eligibleTemplates
    : (eligibleTemplates.length > 0 ? eligibleTemplates : allTemplates);

  if (source.length === 0) {
    return null;
  }

  const totalWeight = source.reduce((sum, template) => {
    return sum + (template.poids || 1);
  }, 0);

  let random = Math.random() * totalWeight;

  for (const template of source) {
    random -= (template.poids || 1);

    if (random <= 0) {
      return template;
    }
  }

  return source[0];
}

function getAvailableSPInfo(caserne) {
  const spUsed = calculateUsedSP(caserne.id);

  const spPosteAvailable = Math.max(0, caserne.sp_poste - spUsed);
  const spTotalAvailable = Math.max(
    0,
    (caserne.sp_poste + caserne.sp_astreinte) - spUsed
  );

  let departDelay = 999;
  let departMode = "indisponible";

  if (spPosteAvailable > 0) {
    departDelay = SETTINGS.departDelay.poste;
    departMode = "poste";
  } else if (spTotalAvailable > 0) {
    departDelay = SETTINGS.departDelay.astreinte;
    departMode = "astreinte";
  }

  return {
    spUsed,
    spPosteAvailable,
    spTotalAvailable,
    departDelay,
    departMode
  };
}

function getAvailableProfilesForVehicle(vehicle) {
  if (!canUseVehicle(vehicle)) {
    return [];
  }

  const caserne = getCaserneById(vehicle.caserneId);

  if (!caserne || (vehicle.etat !== "disponible" && vehicle.etat !== "retour")) {
    return [];
  }

  const typeConfig = getVehicleTypeConfig(vehicle.type);

  if (!typeConfig || !Array.isArray(typeConfig.profils)) {
    return [];
  }

  if (vehicle.etat === "retour") {
    const onboardSp = getReturningVehicleCrewCount(vehicle.id);
    if (onboardSp <= 0) {
      return [];
    }

    return typeConfig.profils
      .filter(profil => profil.sp <= onboardSp)
      .map(profil => ({
        vehicle,
        caserne,
        profil,
        departDelay: 0,
        departMode: "embarque",
        onboardSp
      }));
  }

  const spInfo = getAvailableSPInfo(caserne);

  return typeConfig.profils
    .filter(profil => profil.sp <= spInfo.spTotalAvailable)
    .map(profil => ({
      vehicle,
      caserne,
      profil,
      departDelay: spInfo.departDelay,
      departMode: spInfo.departMode
    }))
    .filter(item => item.departDelay !== 999);
}

function getReturningVehicleCrewCount(vehicleId) {
  if (!vehicleId) {
    return 0;
  }

  const missions = state.activeMissions.filter(mission =>
    mission.vehicleId === vehicleId &&
    mission.phase === "retour"
  );

  const onboardFromActiveMission = missions.length === 0
    ? 0
    : Math.max(...missions.map(mission => Number(mission.spRequired) || 0));

  const vehicle = getVehicleById(vehicleId);
  const onboardFromDetachedReturn = Number(vehicle?.returnToBaseSp) || 0;

  return Math.max(onboardFromActiveMission, onboardFromDetachedReturn);
}

function toRad(deg) {
  return deg * Math.PI / 180;
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getRoutingProvider() {
  return SETTINGS.routing?.provider || "distance";
}

function buildTravelMatrixKey(leftId, rightId) {
  if (!leftId || !rightId) {
    return null;
  }

  return `${leftId}|${rightId}`;
}

function getTravelMatrixValue(groupKey, leftId, rightId) {
  if (!SETTINGS.routing?.matrixEnabled || typeof TRAVEL_MATRIX === "undefined") {
    return null;
  }

  const group = TRAVEL_MATRIX[groupKey];
  if (!group || typeof group !== "object") {
    return null;
  }

  const matrixKey = buildTravelMatrixKey(leftId, rightId);
  if (!matrixKey) {
    return null;
  }

  const value = group[matrixKey];
  return typeof value === "number" ? value : null;
}

function computeTravelTimeFromDistance(lat1, lon1, lat2, lon2) {
  const distanceKm = calculateDistanceKm(lat1, lon1, lat2, lon2);

  const routeFactor = SETTINGS.travel.roadFactor;
  const estimatedRoadDistanceKm = distanceKm * routeFactor;

  const averageSpeedKmH = SETTINGS.travel.averageSpeedKmH;
  const timeMinutes = (estimatedRoadDistanceKm / averageSpeedKmH) * 60;

  return Math.max(SETTINGS.travel.minTimeMinutes, Math.round(timeMinutes));
}

function applyTravelJitter(timeMinutes) {
  const jitter = SETTINGS.routing?.jitterMinutes || 0;
  if (!jitter || jitter <= 0) {
    return timeMinutes;
  }

  const delta = Math.floor((Math.random() * ((jitter * 2) + 1)) - jitter);
  return Math.max(SETTINGS.travel.minTimeMinutes, timeMinutes + delta);
}

function estimateTravelTime(caserne, zone) {
  if (!caserne || !zone) {
    return SETTINGS.travel.minTimeMinutes;
  }

  const provider = getRoutingProvider();
  const tryMatrix = provider === "matrix" || provider === "hybrid";

  let travelTime = null;

  if (tryMatrix) {
    travelTime = getTravelMatrixValue("caserneToZone", caserne.id, zone.id);
  }

  if (travelTime === null) {
    travelTime = computeTravelTimeFromDistance(
      caserne.lat,
      caserne.lon,
      zone.lat,
      zone.lon
    );
  }

  return applyTravelJitter(travelTime);
}

function adjustTravelTimeForVehicleState(vehicle, travelTime) {
  if (!vehicle) {
    return travelTime;
  }

  if (vehicle.etat === "retour" && SETTINGS.REENGAGEMENT_RETOUR.enabled) {
    const factor = SETTINGS.REENGAGEMENT_RETOUR.travelFactor;
    const minDelay = SETTINGS.REENGAGEMENT_RETOUR.minDelay;

    return Math.max(minDelay, Math.round(travelTime * factor));
  }

  return travelTime;
}

function evaluateOptionStaffing(items) {
  const staffingByCaserne = {};

  for (const item of items) {
    if (item?.vehicle?.etat === "retour") {
      continue;
    }

    const caserneId = item.caserne.id;

    if (!staffingByCaserne[caserneId]) {
      const spInfo = getAvailableSPInfo(item.caserne);

      staffingByCaserne[caserneId] = {
        caserne: item.caserne,
        spRequired: 0,
        spPosteAvailable: spInfo.spPosteAvailable,
        spAstreinteAvailable: Math.max(0, spInfo.spTotalAvailable - spInfo.spPosteAvailable)
      };
    }

    staffingByCaserne[caserneId].spRequired += item.profil.sp;
  }

  let totalDelay = 0;

  for (const caserneId of Object.keys(staffingByCaserne)) {
    const entry = staffingByCaserne[caserneId];

    if (entry.spRequired > entry.spPosteAvailable + entry.spAstreinteAvailable) {
      return {
        valid: false,
        staffingByCaserne: null,
        totalDelay: null
      };
    }

    entry.spPosteUsed = Math.min(entry.spRequired, entry.spPosteAvailable);
    entry.spAstreinteUsed = Math.max(0, entry.spRequired - entry.spPosteUsed);

    entry.departMode = entry.spAstreinteUsed > 0 ? "astreinte" : "poste";
    entry.departDelay = entry.spAstreinteUsed > 0
      ? SETTINGS.departDelay.astreinte
      : SETTINGS.departDelay.poste;

    if (entry.departDelay > totalDelay) {
      totalDelay = entry.departDelay;
    }
  }

  return {
    valid: true,
    staffingByCaserne,
    totalDelay
  };
}

function getEffectiveDepartData(item, staffingEntry) {
  if (item?.vehicle?.etat === "retour") {
    return {
      departDelay: item.departDelay,
      departMode: item.departMode
    };
  }

  if (staffingEntry) {
    return {
      departDelay: staffingEntry.departDelay,
      departMode: staffingEntry.departMode
    };
  }

  return {
    departDelay: item?.departDelay ?? 0,
    departMode: item?.departMode || "poste"
  };
}

function closePreviousMissionForVehicle(vehicleId) {
  state.activeMissions = state.activeMissions.filter(mission => {
    return !(mission.vehicleId === vehicleId && mission.phase !== "terminee");
  });

  const vehicle = getVehicleById(vehicleId);
  if (vehicle) {
    delete vehicle.returnToBaseRemaining;
    delete vehicle.returnToBaseSp;
  }
}

function engageSolution(interventionId, optionIndex) {
  const intervention = getInterventionById(interventionId);

  if (!intervention) {
    alert("Intervention introuvable.");
    return;
  }

  const options = findAvailableOptions(intervention);
  const option = options[optionIndex];

  if (!option) {
    alert("Solution introuvable.");
    return;
  }

  if (!canEngageOption(option)) {
    alert("Impossible d'engager cette solution : effectif insuffisant dans une ou plusieurs casernes.");
    return;
  }

    const zone = getZoneById(intervention.zoneId);
  const hospital = intervention.hospitalId
    ? HOPITAUX.find(h => h.id === intervention.hospitalId)
    : null;

  option.moyens.forEach(m => {
    const vehicle = getVehicleById(m.vehicle.id);

    if (!vehicle || (vehicle.etat !== "disponible" && vehicle.etat !== "retour")) {
      return;
    }

    const handlesSUAP = vehicleHandlesSUAP(m);
    const hospitalTransportTime =
    intervention.transportRequired && handlesSUAP && zone && hospital
      ? estimateTravelTimeToHospital(zone, hospital)
      : 0;
    const hospitalReturnTime =
    intervention.transportRequired && handlesSUAP && hospital
      ? estimateTravelTimeHospitalToCaserne(hospital, m.caserne)
      : m.travelTime;

    closePreviousMissionForVehicle(vehicle.id);
    syncVehicleStatusWithPhase(vehicle, "depart");

    state.activeMissions.push({
      id: `MIS_${Date.now()}_${Math.floor(Math.random() * 1000)}_${vehicle.id}`,
      interventionId: intervention.id,
      interventionLabel: intervention.type,
      vehicleId: vehicle.id,
      vehicleLabel: vehicle.nom,
      caserneId: m.caserne.id,
      caserneLabel: m.caserne.nom,
      spRequired: m.profil.sp,
      phase: "depart",
      remaining: m.departDelay,
      travelTime: m.travelTime,
      onSceneTime: intervention.dureeSurPlace,
      hospitalTransportTime,
      returnTime: hospitalReturnTime,
      departMode: m.departMode,
      profilCode: m.profil.code,
      profilMode: m.profil.mode,
      hospitalId: intervention.hospitalId || null,
      hospitalName: intervention.hospitalName || null,
      zone: intervention.zone,
      createdAt: intervention.createdAt || Date.now(),
      needsLabel: intervention.besoins.map(b => `${b.quantite} ${b.code}`).join(", "),
    });
  });

  state.interventions = state.interventions.filter(i => i.id !== interventionId);
  state.selectedInterventionId = null;

  saveState();
  renderAll();
}

function getProfileLabel(profil) {
  return `${profil.code} - ${profil.sp} SP (${profil.mode})`;
}

function buildEngagementFromProfileItem(item) {
  return {
    type: "vehicule",
    vehicleId: item.vehicle.id,
    code: normalizeProfilCode(item.profil),
    codeBase: item.profil.code,
    mode: item.profil.mode,
    sp: item.profil.sp
  };
}

function buildOptionFromItems(intervention, items) {
  const staffing = evaluateOptionStaffing(items);

  if (!staffing.valid) {
    return null;
  }

  const engagements = items.map(buildEngagementFromProfileItem);
  const coverageSummary = getCoverageSummary(intervention, engagements);

  if (!coverageSummary.covered) {
    return null;
  }

  const enrichedItems = items.map(item => {
    const staffingEntry = staffing.staffingByCaserne[item.caserne.id];
    const departData = getEffectiveDepartData(item, staffingEntry);

    return {
      ...item,
      departDelay: departData.departDelay,
      departMode: departData.departMode
    };
  });

  const totalDelay = Math.max(
    ...enrichedItems.map(item => item.departDelay + item.travelTime)
  );

  const label = enrichedItems
    .map(item => `${item.vehicle.nom} - ${getProfileLabel(item.profil)}`)
    .join(" + ");

  return {
    kind: enrichedItems.length === 1 ? "single" : "combo",
    label,
    moyens: enrichedItems,
    totalDelay,
    coverageDetails: coverageSummary.details,
    staffingByCaserne: staffing.staffingByCaserne
  };
}

function hasEnoughSPForOption(items) {
  const spByCaserne = {};

  for (const item of items) {
    const caserneId = item.caserne.id;

    if (!spByCaserne[caserneId]) {
      spByCaserne[caserneId] = 0;
    }

    spByCaserne[caserneId] += item.profil.sp;
  }

  for (const caserneId of Object.keys(spByCaserne)) {
    const caserne = getCaserneById(caserneId);

    if (!caserne) {
      return false;
    }

    const spInfo = getAvailableSPInfo(caserne);
    if (spByCaserne[caserneId] > spInfo.spTotalAvailable) {
      return false;
    }
  }

  return true;
}

function isOptionMinimal(intervention, items) {
  const fullEngagements = items.map(buildEngagementFromProfileItem);
  const fullCoverage = getCoverageSummary(intervention, fullEngagements);

  if (!fullCoverage.covered) {
    return false;
  }

  for (let i = 0; i < items.length; i++) {
    const reducedItems = items.filter((_, index) => index !== i);
    const reducedEngagements = reducedItems.map(buildEngagementFromProfileItem);
    const reducedCoverage = getCoverageSummary(intervention, reducedEngagements);

    if (reducedCoverage.covered) {
      return false;
    }
  }

  return true;
}

function canEngageOption(option) {
  const items = option.moyens.map(m => {
    const vehicle = getVehicleById(m.vehicle.id);

    if (!isVehicleAvailable(vehicle)) {
      return;
    }

    return {
      vehicle,
      caserne: getCaserneById(vehicle.caserneId),
      profil: m.profil,
      travelTime: m.travelTime
    };
  });

  if (items.some(item => !item || !item.caserne)) {
    return false;
  }

  return evaluateOptionStaffing(items).valid;
}

function findAvailableOptions(intervention) {
  const zone = getZoneById(intervention.zoneId);

  if (!zone) {
    return [];
  }

  const availableProfiles = state.vehicules.flatMap(vehicle => {
    if (!canUseVehicle(vehicle)) {
      return [];
    }

    return getAvailableProfilesForVehicle(vehicle).map(item => {
      let travelTime = estimateTravelTime(item.caserne, zone);
      travelTime = adjustDelayForVehicle(item.vehicle, travelTime);

      return {
        vehicle: item.vehicle,
        caserne: item.caserne,
        profil: item.profil,
        departDelay: item.departDelay,
        departMode: item.departMode,
        travelTime
      };
    });
  });

  const solutions = [];
  const signatures = new Set();

  function addOption(items) {
    if (!isOptionMinimal(intervention, items)) {
      return;
    }

    const option = buildOptionFromItems(intervention, items);

    if (!option) {
      return;
    }

    const signature = items
      .map(item => `${item.vehicle.id}:${normalizeProfilCode(item.profil)}`)
      .sort()
      .join("|");

    if (signatures.has(signature)) {
      return;
    }

    signatures.add(signature);
    solutions.push(option);
  }

  for (const a of availableProfiles) {
    addOption([a]);
  }

  for (let i = 0; i < availableProfiles.length; i++) {
    for (let j = i + 1; j < availableProfiles.length; j++) {
      const a = availableProfiles[i];
      const b = availableProfiles[j];

      if (a.vehicle.id === b.vehicle.id) {
        continue;
      }

      addOption([a, b]);
    }
  }

  for (let i = 0; i < availableProfiles.length; i++) {
    for (let j = i + 1; j < availableProfiles.length; j++) {
      for (let k = j + 1; k < availableProfiles.length; k++) {
        const a = availableProfiles[i];
        const b = availableProfiles[j];
        const c = availableProfiles[k];

        const ids = new Set([a.vehicle.id, b.vehicle.id, c.vehicle.id]);
        if (ids.size < 3) {
          continue;
        }

        addOption([a, b, c]);
      }
    }
  }

  for (let i = 0; i < availableProfiles.length; i++) {
    for (let j = i + 1; j < availableProfiles.length; j++) {
      for (let k = j + 1; k < availableProfiles.length; k++) {
        for (let l = k + 1; l < availableProfiles.length; l++) {
          const a = availableProfiles[i];
          const b = availableProfiles[j];
          const c = availableProfiles[k];
          const d = availableProfiles[l];

          const ids = new Set([a.vehicle.id, b.vehicle.id, c.vehicle.id, d.vehicle.id]);
          if (ids.size < 4) {
            continue;
          }

          addOption([a, b, c, d]);
        }
      }
    }
  }

  solutions.sort((a, b) => {
    if (a.totalDelay !== b.totalDelay) {
      return a.totalDelay - b.totalDelay;
    }

    return a.moyens.length - b.moyens.length;
  });

  return solutions.slice(0, 8);
}

function pickWeightedItem(items, getWeight) {
  const totalWeight = items.reduce((sum, item) => {
    return sum + Math.max(0, getWeight(item) || 0);
  }, 0);

  if (totalWeight <= 0) {
    return null;
  }

  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= Math.max(0, getWeight(item) || 0);

    if (random <= 0) {
      return item;
    }
  }

  return items[0] || null;
}

function advanceSimulation() {
  state.simulationMinutes += 1;

  if (state.simulationMinutes >= state.nextStaffingUpdateMinutes) {
    updateDynamicStaffing();
  }

  state.activeMissions.forEach(mission => {
    mission.remaining -= 1;

    if (mission.remaining > 0) {
      return;
    }

    const vehicle = getVehicleById(mission.vehicleId);
    if (!vehicle) {
      return;
    }

        switch (mission.phase) {
      case "depart":
        mission.phase = "trajet";
        mission.remaining = mission.travelTime;
        syncVehicleStatusWithPhase(vehicle, "trajet");
        break;

      case "trajet":
        mission.phase = "sur_place";
        mission.remaining = mission.onSceneTime;
        syncVehicleStatusWithPhase(vehicle, "sur_place");
        break;

      case "sur_place":
        if (mission.hospitalTransportTime && mission.hospitalTransportTime > 0) {
          mission.phase = "transport_hopital";
          mission.remaining = mission.hospitalTransportTime;
          syncVehicleStatusWithPhase(vehicle, "transport_hopital");
        } else {
          mission.phase = "retour";
          mission.remaining = mission.returnTime;
          syncVehicleStatusWithPhase(vehicle, "retour");
        }
        break;

      case "transport_hopital":
        mission.phase = "retour";
        mission.remaining = mission.returnTime;
        syncVehicleStatusWithPhase(vehicle, "retour");
        break;

      case "retour":
        mission.phase = "terminee";
        mission.remaining = 0;
        syncVehicleStatusWithPhase(vehicle, "disponible");
        break;
    }
  });

  state.activeMissions = state.activeMissions.filter(mission => mission.phase !== "terminee");

  let hasVehicleTransferUpdate = false;
  state.vehicules.forEach(vehicle => {
    if (vehicle.etat !== "transit_caserne") {
      return;
    }

    if (typeof vehicle.transitRemaining !== "number") {
      return;
    }

    vehicle.transitRemaining -= 1;

    if (vehicle.transitRemaining > 0) {
      return;
    }

    if (vehicle.transitTargetCaserneId) {
      vehicle.caserneId = vehicle.transitTargetCaserneId;
    }

    delete vehicle.transitRemaining;
    delete vehicle.transitTargetCaserneId;
    delete vehicle.transitFromCaserneId;
    syncVehicleStatusWithPhase(vehicle, "disponible");
    hasVehicleTransferUpdate = true;
  });

  if (hasVehicleTransferUpdate) {
    saveData(STORAGE_KEYS.VEHICULES, state.vehicules);
  }

  state.vehicules.forEach(vehicle => {
    if (typeof vehicle.returnToBaseRemaining !== "number") {
      return;
    }

    vehicle.returnToBaseRemaining -= 1;

    if (vehicle.returnToBaseRemaining > 0) {
      return;
    }

    delete vehicle.returnToBaseRemaining;
    delete vehicle.returnToBaseSp;
    syncVehicleStatusWithPhase(vehicle, "disponible");
  });

  finalizeCompletedInterventions();

  saveState();
  renderAll();
}

function pickZoneForTemplate(template) {
  const availableZoneIds = getAvailableZoneIdsForTemplate(template);
  const availableZones = getActiveZones().filter(zone => availableZoneIds.includes(zone.id));
  const influenceConfig = getInfluenceConfig();

  const inOperationalReach = availableZones.filter(zone =>
    getNearestOwnedCaserneDistanceKm(zone) <= influenceConfig.maxOperationalDistanceKm
  );

  const source = inOperationalReach.length > 0
    ? inOperationalReach
    : availableZones
        .slice()
        .sort((a, b) => getNearestOwnedCaserneDistanceKm(a) - getNearestOwnedCaserneDistanceKm(b))
        .slice(0, 20);

  return pickWeightedItem(source, zone => getZoneInfluenceWeight(zone));
}

function getZonePopulation(zone) {
  if (!zone) {
    return 0;
  }

  if (typeof zone.population === "number" && Number.isFinite(zone.population) && zone.population > 0) {
    return Math.round(zone.population);
  }

  // Backward-compatible fallback:
  // if no explicit population is defined in data/zones.js,
  // we derive a rough estimate from existing intervention weight.
  const fallbackWeight = Number(zone.poidsIntervention) || 1;
  return Math.max(300, Math.round(fallbackWeight * 1000));
}

function getInfluenceConfig() {
  const cfg = SETTINGS?.zoneInfluence || {};
  return {
    radiusKm: typeof cfg.radiusKm === "number" && cfg.radiusKm > 0 ? cfg.radiusKm : 14,
    minFactor: typeof cfg.minFactor === "number" && cfg.minFactor >= 0 ? cfg.minFactor : 0.2,
    maxOperationalDistanceKm:
      typeof cfg.maxOperationalDistanceKm === "number" && cfg.maxOperationalDistanceKm > 0
        ? cfg.maxOperationalDistanceKm
        : 35
  };
}

function getOwnedCasernesForInfluence() {
  const owned = getOwnedCasernes();
  if (owned.length > 0) {
    return owned;
  }

  return state.casernes || [];
}

function getCaserneDistanceFactor(caserne, zone, influenceConfig) {
  if (!caserne || !zone) {
    return influenceConfig.minFactor;
  }

  const distanceKm = calculateDistanceKm(caserne.lat, caserne.lon, zone.lat, zone.lon);
  const normalized = distanceKm / influenceConfig.radiusKm;
  const factor = 1 / (1 + (normalized * normalized));
  return Math.max(influenceConfig.minFactor, factor);
}

function getBestCaserneInfluenceForZone(zone, options = {}) {
  const enforceOperationalRange = options.enforceOperationalRange !== false;
  const casernes = getOwnedCasernesForInfluence();
  if (!casernes.length) {
    return { bestFactor: 1, nearestCaserne: null };
  }

  const influenceConfig = getInfluenceConfig();
  let bestFactor = 0;
  let nearestCaserne = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  casernes.forEach(caserne => {
    const distanceKm = calculateDistanceKm(caserne.lat, caserne.lon, zone.lat, zone.lon);
    if (enforceOperationalRange && distanceKm > influenceConfig.maxOperationalDistanceKm) {
      return;
    }

    const factor = getCaserneDistanceFactor(caserne, zone, influenceConfig);

    if (factor > bestFactor) {
      bestFactor = factor;
      nearestCaserne = caserne;
      bestDistance = distanceKm;
      return;
    }

    if (factor === bestFactor && distanceKm < bestDistance) {
      nearestCaserne = caserne;
      bestDistance = distanceKm;
    }
  });

  if (!nearestCaserne) {
    return { bestFactor: 0, nearestCaserne: null };
  }

  return { bestFactor, nearestCaserne };
}

function getZoneInfluenceWeight(zone) {
  const population = getZonePopulation(zone);
  const { bestFactor } = getBestCaserneInfluenceForZone(zone, { enforceOperationalRange: false });
  const weight = population * Math.max(0.01, bestFactor);
  return Math.max(1, Math.round(weight));
}

function getNearestOwnedCaserneDistanceKm(zone) {
  if (!zone) {
    return Number.POSITIVE_INFINITY;
  }

  const casernes = getOwnedCasernesForInfluence();
  if (!casernes.length) {
    return Number.POSITIVE_INFINITY;
  }

  let best = Number.POSITIVE_INFINITY;
  casernes.forEach(caserne => {
    const distance = calculateDistanceKm(caserne.lat, caserne.lon, zone.lat, zone.lon);
    if (distance < best) {
      best = distance;
    }
  });

  return best;
}

function getInfluencePopulationByCaserneId(caserneId) {
  if (!caserneId) {
    return 0;
  }

  let sum = 0;

  getActiveZones().forEach(zone => {
    const { nearestCaserne } = getBestCaserneInfluenceForZone(zone);
    if (nearestCaserne && nearestCaserne.id === caserneId) {
      sum += getZonePopulation(zone);
    }
  });

  return sum;
}

function getInfluenceZoneCountByCaserneId(caserneId) {
  if (!caserneId) {
    return 0;
  }

  let count = 0;

  getActiveZones().forEach(zone => {
    const { nearestCaserne } = getBestCaserneInfluenceForZone(zone);
    if (nearestCaserne && nearestCaserne.id === caserneId) {
      count += 1;
    }
  });

  return count;
}

function getAvailableZoneIdsForTemplate(template) {
  const activeZones = getActiveZones();

  if (!template.zones || template.zones === "ALL") {
    return activeZones.map(zone => zone.id);
  }

  if (Array.isArray(template.zones)) {
    return template.zones;
  }

  return [];
}

function generateIntervention() {
  const template = pickWeightedInterventionTemplate();
  if (!template) {
    alert("Aucune intervention compatible avec la flotte actuelle.");
    return;
  }

  const zone = pickZoneForTemplate(template);

  if (!zone) {
    alert(`Aucune zone disponible pour l'intervention : ${template.type}`);
    return;
  }

  const transportRequired = shouldRequireHospitalTransport(template);
  const hospital = transportRequired ? pickNearestHospital(zone) : null;

  const newId = `INT${String(state.nextInterventionId).padStart(3, "0")}`;

  state.interventions.push({
    id: newId,
    type: template.type,
    zoneId: zone.id,
    zone: zone.nom,
    dureeSurPlace: template.dureeSurPlace,
    besoins: JSON.parse(JSON.stringify(template.besoins)),
    options: JSON.parse(JSON.stringify(template.options || [])),
    createdAt: Date.now(),
    createdAtSimulationMinutes: state.simulationMinutes,
    transportRequired,
    hospitalId: hospital ? hospital.id : null,
    hospitalName: hospital ? hospital.nom : null,
    status: "ALERTE"
  });

  state.nextInterventionId += 1;
  saveState();
  renderAll();
}

function getDispatchSelection(interventionId) {
  if (!state.dispatchSelections[interventionId]) {
    state.dispatchSelections[interventionId] = [];
  }

  return state.dispatchSelections[interventionId];
}

function clearDispatchSelection(interventionId) {
  state.dispatchSelections[interventionId] = [];
  refreshInterventionStatus(interventionId);
}

function getAllowedContributionCodesForIntervention(intervention) {
  const allowedCodes = new Set();

  const besoins = Array.isArray(intervention?.besoins) ? intervention.besoins : [];
  const options = Array.isArray(intervention?.options) ? intervention.options : [];

  besoins.forEach(besoin => {
    allowedCodes.add(besoin.code);

    const rules = COVERAGE_RULES[besoin.code] || [];
    rules.forEach(rule => {
      rule.requires.forEach(requirement => {
        allowedCodes.add(requirement.code);
      });
    });
  });

  options.forEach(option => {
    const optionCode = option.code || option.type;
    if (!optionCode) return;

    allowedCodes.add(optionCode);

    const rules = COVERAGE_RULES[optionCode] || [];
    rules.forEach(rule => {
      rule.requires.forEach(requirement => {
        allowedCodes.add(requirement.code);
      });
    });
  });

  return allowedCodes;
}

function getBaseDisplayCode(code) {
  return code
    .replace(/_DEGRADE$/, "")
    .replace(/_REDUIT$/, "");
}

function profileContributesToNeed(profileCode, baseCode, needCode) {
  if (!needCode) {
    return false;
  }

  if (profileCode === needCode || baseCode === needCode) {
    return true;
  }

  const rules = COVERAGE_RULES?.[needCode] || [];
  return rules.some(rule =>
    (rule.requires || []).some(requirement =>
      requirement.code === profileCode || requirement.code === baseCode
    )
  );
}

function getVehicleSelectableProfiles(vehicle, intervention) {
  const availableProfiles = getAvailableProfilesForVehicle(vehicle);

  if (!intervention || !Array.isArray(intervention.besoins)) {
    return [];
  }

  const allowedCodes = getAllowedContributionCodesForIntervention(intervention);
  const currentSelection = getDispatchSelection(intervention.id);
  const selectableProfiles = [];
  const signatures = new Set();
  const evaluationCache = new Map();

  function getProfileKey(profileItem) {
    return `${profileItem.vehicle.id}|${profileItem.profil.code}|${profileItem.profil.mode}|${profileItem.profil.sp}`;
  }

  function computeTotalDelayFromSelectedItems(selectedItems) {
    if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
      return Number.POSITIVE_INFINITY;
    }

    return Math.max(...selectedItems.map(entry => {
      const baseDepartDelay = typeof entry.departDelay === "number" ? entry.departDelay : 0;
      const travelTime = typeof entry.travelTime === "number" ? entry.travelTime : 0;
      return baseDepartDelay + travelTime;
    }));
  }

  function evaluateProfileWithCurrentSelection(profileItem) {
    const profileKey = getProfileKey(profileItem);
    const cached = evaluationCache.get(profileKey);
    if (cached) {
      return cached;
    }

    const simulatedSelection = [
      ...currentSelection,
      {
        vehicleId: profileItem.vehicle.id,
        profilCode: profileItem.profil.code,
        profilMode: profileItem.profil.mode,
        profilSp: profileItem.profil.sp
      }
    ];

    const selectedItems = simulatedSelection
      .map(selectionItem => {
        const selectedVehicle = getVehicleById(selectionItem.vehicleId);
        if (!selectedVehicle) {
          return null;
        }

        const selectedProfiles = getAvailableProfilesForVehicle(selectedVehicle);
        const selectedProfile = selectedProfiles.find(
          p =>
            p.profil.code === selectionItem.profilCode &&
            p.profil.mode === selectionItem.profilMode &&
            p.profil.sp === selectionItem.profilSp
        );

        if (!selectedProfile) {
          return null;
        }

        const zone = getZoneById(intervention.zoneId);
        let travelTime = zone ? estimateTravelTime(selectedProfile.caserne, zone) : 0;
        travelTime = adjustDelayForVehicle(selectedVehicle, travelTime);

        return {
          vehicle: selectedProfile.vehicle,
          caserne: selectedProfile.caserne,
          profil: selectedProfile.profil,
          departDelay: selectedProfile.departDelay,
          departMode: selectedProfile.departMode,
          travelTime
        };
      })
      .filter(Boolean);

    const engagements = selectedItems.map(buildEngagementFromProfileItem);
    const coverageSummary = getCoverageSummary(intervention, engagements);
    const optionCoverageSummary = getOptionCoverageSummary(intervention, engagements);
    const staffingEvaluation = evaluateOptionStaffing(selectedItems);

    const result = {
      selectedItems,
      coverageSummary,
      optionCoverageSummary,
      staffingEvaluation,
      totalDelay: computeTotalDelayFromSelectedItems(selectedItems)
    };

    evaluationCache.set(profileKey, result);
    return result;
  }

  let bestMainNeedDelay = Number.POSITIVE_INFINITY;

  availableProfiles.forEach(profileItem => {
    const evaluation = evaluateProfileWithCurrentSelection(profileItem);
    if (!evaluation.staffingEvaluation.valid) {
      return;
    }

    const contributesToMainNeed =
      evaluation.coverageSummary.covered ||
      evaluation.coverageSummary.details?.some(detail => detail.covered);

    if (!contributesToMainNeed) {
      return;
    }

    if (evaluation.totalDelay < bestMainNeedDelay) {
      bestMainNeedDelay = evaluation.totalDelay;
    }
  });

  availableProfiles.forEach(item => {
    const normalizedCode = normalizeProfilCode(item.profil);
    const rawCode = normalizedCode || item.profil.code;
    const baseCode = getBaseDisplayCode(rawCode);

    const isAllowed =
      allowedCodes.has(item.profil.code) ||
      allowedCodes.has(normalizedCode) ||
      allowedCodes.has(baseCode);

    if (!isAllowed) {
      return;
    }

    const evaluation = evaluateProfileWithCurrentSelection(item);
    const coverageSummary = evaluation.coverageSummary;
    const optionCoverageSummary = evaluation.optionCoverageSummary;
    const staffingEvaluation = evaluation.staffingEvaluation;

    if (!staffingEvaluation.valid) {
      return;
    }

    const contributesToMainNeed =
      coverageSummary.covered ||
      coverageSummary.details?.some(detail => detail.covered);

    const missingNeedCodes = (coverageSummary.details || [])
      .filter(detail => !detail.covered)
      .map(detail => detail.code);

    const contributesToMissingNeed = missingNeedCodes.some(needCode =>
      profileContributesToNeed(item.profil.code, rawCode, needCode) ||
      profileContributesToNeed(rawCode, baseCode, needCode)
    );

    const optionCovered =
      optionCoverageSummary.hasOptions &&
      optionCoverageSummary.details?.some(detail => detail.covered);

    const optionFasterThanBestMain =
      !Number.isFinite(bestMainNeedDelay) ||
      evaluation.totalDelay < bestMainNeedDelay;

    const contributesToOption =
      optionCovered && optionFasterThanBestMain;

    if (!contributesToMainNeed && !contributesToMissingNeed && !contributesToOption) {
      return;
    }

    const signature = `${item.vehicle.id}|${item.profil.code}|${item.profil.mode}|${item.profil.sp}`;
    if (signatures.has(signature)) {
      return;
    }

    signatures.add(signature);
    selectableProfiles.push({
      vehicle: item.vehicle,
      caserne: item.caserne,
      profil: item.profil,
      normalizedCode,
      displayCode: baseCode,
      departDelay: item.departDelay,
      departMode: item.departMode
    });
  });

  return selectableProfiles.sort((a, b) => {
    if (a.displayCode < b.displayCode) return -1;
    if (a.displayCode > b.displayCode) return 1;
    return b.profil.sp - a.profil.sp;
  });
}     

function addVehicleToSelection(interventionId, vehicleId, profilCode, profilMode, profilSp) {
  const intervention = getInterventionById(interventionId);
  const vehicle = getVehicleById(vehicleId);

  if (!intervention || !isVehicleSelectableForIntervention(vehicle, interventionId)) {
    return false;
  }

  const selection = getDispatchSelection(interventionId);

  const alreadySelected = selection.some(item => item.vehicleId === vehicleId);
  if (alreadySelected) {
    return false;
  }

  const selectableProfiles = getVehicleSelectableProfiles(vehicle, intervention);
  const selectedProfile = selectableProfiles.find(item =>
    item.profil.code === profilCode &&
    item.profil.mode === profilMode &&
    item.profil.sp === profilSp
  );

  if (!selectedProfile) {
    return false;
  }

  selection.push({
    vehicleId: vehicle.id,
    profilCode: selectedProfile.profil.code,
    profilMode: selectedProfile.profil.mode,
    profilSp: selectedProfile.profil.sp
  });

  refreshInterventionStatus(interventionId);
  saveState();
  renderAll();
  return true;
}

function removeVehicleFromSelection(interventionId, vehicleId) {
  const selection = getDispatchSelection(interventionId);

  state.dispatchSelections[interventionId] = selection.filter(item => item.vehicleId !== vehicleId);

  refreshInterventionStatus(interventionId);
  saveState();
  renderAll();
}

function getSelectedItemsForIntervention(interventionId) {
  const intervention = getInterventionById(interventionId);

  if (!intervention) {
    return [];
  }

  const selection = getDispatchSelection(interventionId);

  return selection.map(item => {
    const vehicle = getVehicleById(item.vehicleId);

    if (!isVehicleSelectableForIntervention(vehicle, interventionId)) {
      return null;
    }

    const availableProfiles = getAvailableProfilesForVehicle(vehicle);

    const profileItem = availableProfiles.find(p =>
      p.profil.code === item.profilCode &&
      p.profil.mode === item.profilMode &&
      p.profil.sp === item.profilSp
    );

    if (!profileItem) {
      return null;
    }

    const zone = getZoneById(intervention.zoneId);
    let travelTime = zone ? estimateTravelTime(profileItem.caserne, zone) : 0;
    travelTime = adjustDelayForVehicle(vehicle, travelTime);

    return {
      vehicle: profileItem.vehicle,
      caserne: profileItem.caserne,
      profil: profileItem.profil,
      departDelay: profileItem.departDelay,
      departMode: profileItem.departMode,
      travelTime
    };
  }).filter(Boolean);
}

function getOptionCoverageSummary(intervention, engagements) {
  if (!intervention || !Array.isArray(intervention.options) || intervention.options.length === 0) {
    return {
      hasOptions: false,
      covered: false,
      details: []
    };
  }

  const details = intervention.options.map(option => {
    const optionCode = option.code || option.type;
    const requiredQty = option.quantite || 1;

    const coveredCount = engagements.reduce((count, engagement) => {
      if (!engagement) {
        return count;
      }

      const normalizedCode = engagement.code;
      const baseCode = engagement.codeBase || engagement.code;

      return (normalizedCode === optionCode || baseCode === optionCode)
        ? count + 1
        : count;
    }, 0);

    return {
      code: optionCode,
      quantite: requiredQty,
      label: option.label || optionCode,
      coveredQty: Math.min(coveredCount, requiredQty),
      covered: coveredCount >= requiredQty
    };
  });

  return {
    hasOptions: true,
    covered: details.every(detail => detail.covered),
    details
  };
}

function evaluateSelection(interventionId) {
  const intervention = getInterventionById(interventionId);

  if (!intervention) {
    return null;
  }

  const selectedItems = getSelectedItemsForIntervention(interventionId);
  const committedItems = getCommittedItemsForIntervention(interventionId);
  const items = [...committedItems, ...selectedItems];

  const staffing = evaluateOptionStaffing(selectedItems);
  const engagements = items.map(buildEngagementFromProfileItem);

  const coverageSummary = getCoverageSummary(intervention, engagements);
  const optionCoverageSummary = getOptionCoverageSummary(intervention, engagements);

  let totalDelay = null;

  if (staffing.valid && selectedItems.length > 0) {
  totalDelay = Math.max(
    ...selectedItems.map(item => {
      const staffingEntry = staffing.staffingByCaserne[item.caserne.id];
      const departDelay = getEffectiveDepartData(item, staffingEntry).departDelay;
      return departDelay + item.travelTime;
    })
  );
}

  const reasons = [];

  if (selectedItems.length === 0) {
    reasons.push("Aucun moyen sélectionné.");
  }

  const missingNeeds = coverageSummary.details
    .filter(detail => !detail.covered)
    .map(detail => detail.code);

  if (missingNeeds.length > 0) {
    reasons.push(`Besoins non couverts : ${missingNeeds.join(", ")}.`);
  }

  if (!staffing.valid) {
    reasons.push("Effectif insuffisant dans une ou plusieurs casernes.");
  }

  const coveredOptions = optionCoverageSummary.details.filter(detail => detail.covered);
  const hasUsefulOption = coveredOptions.length > 0;

  let status = "invalid";

  if (items.length > 0 && staffing.valid && coverageSummary.covered) {
    status = "complete";
  } else if (items.length > 0 && staffing.valid && hasUsefulOption) {
    status = "partial";
  }

  return {
    items,
    staffing,
    coverageSummary,
    optionCoverageSummary,
    status,
    canEngage: selectedItems.length > 0 && staffing.valid && (coverageSummary.covered || hasUsefulOption),
    totalDelay,
    reasons
  };
}

function engageSelection(interventionId) {
  const intervention = getInterventionById(interventionId);

  if (!intervention) {
    alert("Intervention introuvable.");
    return;
  }

  const evaluation = evaluateSelection(interventionId);

  if (!evaluation) {
    alert("Impossible d'évaluer la sélection.");
    return;
  }

  const engagedInterventionStatus = evaluation.coverageSummary.covered
  ? "ENGAGEMENT_COMPLET"
  : "ENGAGEMENT_PARTIEL";

  if (!evaluation || !evaluation.canEngage) {
    const reasons = evaluation?.reasons?.length
      ? "\n- " + evaluation.reasons.join("\n- ")
      : "";

    alert(`Impossible d'engager la sélection.${reasons}`);
    return;
  }

  const zone = getZoneById(intervention.zoneId);
  const hospital = intervention.hospitalId
    ? HOPITAUX.find(h => h.id === intervention.hospitalId)
    : null;

  let engagedCount = 0;

    const selectedItems = getSelectedItemsForIntervention(interventionId);

  selectedItems.forEach(item => {
    const vehicle = getVehicleById(item.vehicle.id);

    if (!vehicle || !isVehicleSelectableForIntervention(vehicle, interventionId)) {
      return;
    }

    const staffingEntry = evaluation.staffing?.staffingByCaserne?.[item.caserne.id];
    const departData = getEffectiveDepartData(item, staffingEntry);
    const departDelay = departData.departDelay;
    const departMode = departData.departMode;

    const handlesSUAP = vehicleHandlesSUAP(item);
    const hospitalTransportTime =
      intervention.transportRequired && handlesSUAP && zone && hospital
        ? estimateTravelTimeToHospital(zone, hospital)
        : 0;

    const hospitalReturnTime =
      intervention.transportRequired && handlesSUAP && hospital
        ? estimateTravelTimeHospitalToCaserne(hospital, item.caserne)
        : item.travelTime;

    closePreviousMissionForVehicle(vehicle.id);
    syncVehicleStatusWithPhase(vehicle, "depart");

    state.activeMissions.push({
      id: `MIS_${Date.now()}_${Math.floor(Math.random() * 1000)}_${vehicle.id}`,
      interventionId: intervention.id,
      interventionLabel: intervention.type,
      vehicleId: vehicle.id,
      vehicleLabel: vehicle.nom,
      caserneId: item.caserne.id,
      caserneLabel: item.caserne.nom,
      spRequired: item.profil.sp,
      phase: "depart",
      remaining: departDelay,
      travelTime: item.travelTime,
      onSceneTime: intervention.dureeSurPlace,
      hospitalTransportTime,
      returnTime: hospitalReturnTime,
      departMode,
      profilCode: item.profil.code,
      profilMode: item.profil.mode,
      hospitalId: intervention.hospitalId || null,
      hospitalName: intervention.hospitalName || null,
      zone: intervention.zone,
      createdAt: intervention.createdAt || Date.now(),
      needsLabel: intervention.besoins.map(b => `${b.quantite} ${b.code}`).join(", "),
      interventionStatus: engagedInterventionStatus,
      mainCoverageComplete: evaluation.coverageSummary.covered,
      optionCoverageComplete: evaluation.optionCoverageSummary?.covered || false,
    });

    engagedCount += 1;
  });

    refreshActiveMissionStatuses(interventionId);

  if (engagedCount === 0) {
    alert("Aucun véhicule n'a pu être engagé.");
    saveState();
    renderAll();
    return;
  }

  const currentIntervention = getInterventionById(interventionId);

  if (currentIntervention) {
    currentIntervention.status = engagedInterventionStatus;
    currentIntervention.isActive = true;
    currentIntervention.engagedVehicleCount = engagedCount;
    currentIntervention.requiredVehicleBaseline = (currentIntervention.besoins || [])
      .reduce((sum, besoin) => sum + (besoin.quantite || 1), 0);
    if (typeof currentIntervention.engagedAtSimulationMinutes !== "number") {
      currentIntervention.engagedAtSimulationMinutes = state.simulationMinutes;
    }
  }

  state.dispatchSelections[interventionId] = [];

  state.selectedInterventionId = null;

  saveState();
  renderAll();
}

function getActiveMissionsForIntervention(interventionId) {
  return state.activeMissions.filter(mission => mission.interventionId === interventionId);
}

function openActiveIntervention(interventionId) {
  const intervention = getInterventionById(interventionId);

  if (!intervention) {
    return;
  }

  state.selectedInterventionId = interventionId;
  saveState();
  renderAll();
}

function getCommittedItemsForIntervention(interventionId) {
  const missions = getActiveMissionsForIntervention(interventionId);

  return missions.map(mission => {
    const vehicle = getVehicleById(mission.vehicleId);
    const caserne = getCaserneById(mission.caserneId);

    if (!vehicle || !caserne) {
      return null;
    }

    return {
      vehicle,
      caserne,
      profil: {
        code: mission.profilCode,
        mode: mission.profilMode,
        sp: mission.spRequired
      },
      departDelay: 0,
      departMode: mission.departMode || "poste",
      travelTime: mission.travelTime || 0,
      alreadyEngaged: true
    };
  }).filter(Boolean);
}

function refreshActiveMissionStatuses(interventionId) {
  const intervention = getInterventionById(interventionId);
  if (!intervention) {
    return;
  }

  const committedItems = getCommittedItemsForIntervention(interventionId);
  const engagements = committedItems.map(buildEngagementFromProfileItem);

  const coverageSummary = getCoverageSummary(intervention, engagements);
  const optionCoverageSummary = getOptionCoverageSummary(intervention, engagements);

  let status = "ENGAGEMENT_PARTIEL";
  if (coverageSummary.covered) {
    status = "ENGAGEMENT_COMPLET";
  }

  intervention.status = status;

  state.activeMissions.forEach(mission => {
    if (mission.interventionId === interventionId) {
      mission.interventionStatus = status;
      mission.mainCoverageComplete = coverageSummary.covered;
      mission.optionCoverageComplete = optionCoverageSummary?.covered || false;
    }
  });
}

function getAllItemsForIntervention(interventionId) {
  const committedItems = getCommittedItemsForIntervention(interventionId);
  const selectedItems = getSelectedItemsForIntervention(interventionId);

  return [...committedItems, ...selectedItems];
}

function getMissingNeedCodes(interventionId) {
  const evaluation = evaluateSelection(interventionId);

  if (!evaluation || !evaluation.coverageSummary) {
    return [];
  }

  return evaluation.coverageSummary.details
    .filter(detail => !detail.covered)
    .map(detail => detail.code);
}

function profileHelpsMissingNeeds(profileEntry, missingNeedCodes) {
  if (!profileEntry || !Array.isArray(missingNeedCodes) || missingNeedCodes.length === 0) {
    return false;
  }

  const normalizedCode = profileEntry.normalizedCode || normalizeProfilCode(profileEntry.profil);
  const displayCode = profileEntry.displayCode || profileEntry.profil.code;

  return missingNeedCodes.some(code => {
    const rules = COVERAGE_RULES[code] || [];

    if (displayCode === code || normalizedCode === code) {
      return true;
    }

    return rules.some(rule =>
      rule.requires.some(requirement =>
        requirement.code === displayCode || requirement.code === normalizedCode
      )
    );
  });
}

function getBestMainNeedDelay(intervention, needCode) {
  const zone = getZoneById(intervention.zoneId);

  if (!zone) {
    return null;
  }

  let best = null;

  state.vehicules.forEach(vehicle => {
    if (!canUseVehicle(vehicle)) {
      return;
    }

    if (!isVehicleSelectableForIntervention(vehicle, intervention.id)) {
      return;
    }

    const profiles = getVehicleSelectableProfiles(vehicle, intervention);

    profiles.forEach(profile => {
      const normalizedCode = profile.normalizedCode || normalizeProfilCode(profile.profil);
      const baseCode = profile.displayCode || profile.profil.code;

      const matchesNeed = normalizedCode === needCode || baseCode === needCode;
      if (!matchesNeed) {
        return;
      }

      let travelTime = estimateTravelTime(profile.caserne, zone);
      travelTime = adjustDelayForVehicle(vehicle, travelTime);

      const totalDelay = profile.departDelay + travelTime;

      if (!best || totalDelay < best.totalDelay) {
        best = {
          vehicleId: vehicle.id,
          caserneId: profile.caserne.id,
          totalDelay
        };
      }
    });
  });

  return best;
}

function profileHelpsOptionalNeed(profileEntry, intervention) {
  if (!profileEntry || !intervention || !Array.isArray(intervention.options)) {
    return false;
  }

  const hasPSOption = intervention.options.some(option => (option.code || option.type) === "PS");
  if (!hasPSOption) {
    return false;
  }

  const normalizedCode = profileEntry.normalizedCode || normalizeProfilCode(profileEntry.profil);
  const baseCode = profileEntry.displayCode || profileEntry.profil.code;

  if (normalizedCode !== "PS" && baseCode !== "PS") {
    return false;
  }

  const zone = getZoneById(intervention.zoneId);
  if (!zone) {
    return false;
  }

  const bestSUAP = getBestMainNeedDelay(intervention, "SUAP");
  if (!bestSUAP) {
    return true;
  }

  const psTravelTime = adjustDelayForVehicle(
    profileEntry.vehicle,
    estimateTravelTime(profileEntry.caserne, zone)
  );
  const psTotalDelay = profileEntry.departDelay + psTravelTime;

  const psActuallyFaster = psTotalDelay < bestSUAP.totalDelay;

  return psActuallyFaster;
}

function shouldRequireHospitalTransport(template) {
  if (!hasFeatureUnlocked("hospitalTransport")) {
    return false;
  }

  if (!template.transportHopital || !template.transportHopital.possible) {
    return false;
  }

  const probability = template.transportHopital.probabilite || 0;
  return Math.random() < probability;
}

function pickNearestHospital(zone) {
  if (!zone || !Array.isArray(HOPITAUX) || HOPITAUX.length === 0) {
    return null;
  }

  let nearestHospital = null;
  let bestDistance = Infinity;

  HOPITAUX.forEach(hospital => {
    const distance = calculateDistanceKm(zone.lat, zone.lon, hospital.lat, hospital.lon);

    if (distance < bestDistance) {
      bestDistance = distance;
      nearestHospital = hospital;
    }
  });

  return nearestHospital;
}

function vehicleHandlesSUAP(item) {
  if (!item || !item.profil) {
    return false;
  }

  const normalizedCode = normalizeProfilCode(item.profil);
  return item.profil.code === "SUAP" || normalizedCode === "SUAP";
}

function estimateTravelTimeToHospital(zone, hospital) {
  if (!zone || !hospital) {
    return 0;
  }

  const provider = getRoutingProvider();
  const tryMatrix = provider === "matrix" || provider === "hybrid";

  let travelTime = null;

  if (tryMatrix) {
    travelTime = getTravelMatrixValue("zoneToHospital", zone.id, hospital.id);
  }

  if (travelTime === null) {
    travelTime = computeTravelTimeFromDistance(
      zone.lat,
      zone.lon,
      hospital.lat,
      hospital.lon
    );
  }

  return applyTravelJitter(travelTime);
}

function estimateTravelTimeHospitalToCaserne(hospital, caserne) {
  if (!hospital || !caserne) {
    return 0;
  }

  const provider = getRoutingProvider();
  const tryMatrix = provider === "matrix" || provider === "hybrid";

  let travelTime = null;

  if (tryMatrix) {
    travelTime = getTravelMatrixValue("hospitalToCaserne", hospital.id, caserne.id);
  }

  if (travelTime === null) {
    travelTime = computeTravelTimeFromDistance(
      hospital.lat,
      hospital.lon,
      caserne.lat,
      caserne.lon
    );
  }

  return applyTravelJitter(travelTime);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateEffectifValue(effectifConfig) {
  const variation = randomInt(
    -SETTINGS.staffing.maxVariationPerUpdate,
    SETTINGS.staffing.maxVariationPerUpdate
  );

  effectifConfig.current = clamp(
    effectifConfig.current + variation,
    effectifConfig.min,
    effectifConfig.max
  );
}

function updateDynamicStaffing() {
  state.casernes.forEach(caserne => {
    if (!caserne.effectifs) {
      return;
    }

    if (caserne.effectifs.poste) {
      updateEffectifValue(caserne.effectifs.poste);
      caserne.sp_poste = caserne.effectifs.poste.current;
    }

    if (caserne.effectifs.astreinte) {
      updateEffectifValue(caserne.effectifs.astreinte);
      caserne.sp_astreinte = caserne.effectifs.astreinte.current;
    }
  });

  state.nextStaffingUpdateMinutes =
    state.simulationMinutes + (SETTINGS.staffing.updateIntervalHours * 60);

  saveState();
}

function setVehicleStatus(vehicle, status) {
  if (!vehicle) {
    return;
  }

  vehicle.status = status;
}

function syncVehicleStatusWithPhase(vehicle, phase) {
  if (!vehicle) {
    return;
  }

  switch (phase) {
    case "reserve":
      vehicle.status = "RESERVE";
      vehicle.etat = "disponible";
      break;

    case "depart":
      vehicle.status = "ALERTE";
      vehicle.etat = "depart";
      break;

    case "trajet":
      vehicle.status = "PARTI";
      vehicle.etat = "trajet";
      break;

    case "sur_place":
      vehicle.status = "SUR_LIEUX";
      vehicle.etat = "sur_place";
      break;

    case "transport_hopital":
      vehicle.status = "TRANSPORT";
      vehicle.etat = "transport";
      break;

    case "retour":
      vehicle.status = "RETOUR";
      vehicle.etat = "retour";
      break;

    default:
      vehicle.status = "DISPO";
      vehicle.etat = "disponible";
      break;
  }
}

function isVehicleReserved(vehicleId) {
  return Object.values(state.dispatchSelections || {}).some(selection =>
    Array.isArray(selection) && selection.some(item => item.vehicleId === vehicleId)
  );
}

function isVehicleSelectableForIntervention(vehicle, interventionId) {
  if (!vehicle || !canUseVehicle(vehicle) || (vehicle.etat !== "disponible" && vehicle.etat !== "retour")) {
    return false;
  }

  if (!isVehicleReserved(vehicle.id)) {
    return true;
  }

  const selection = getDispatchSelection(interventionId);
  return selection.some(item => item.vehicleId === vehicle.id);
}

function isVehicleEngaged(vehicleId) {
  return state.activeMissions.some(mission => mission.vehicleId === vehicleId);
}

function canVehicleBeTransferred(vehicle) {
  if (!vehicle) {
    return false;
  }

  if (!canUseVehicle(vehicle)) {
    return false;
  }

  if (isVehicleEngaged(vehicle.id)) {
    return false;
  }

  if (vehicle.etat === "transit_caserne") {
    return false;
  }

  if (typeof vehicle.returnToBaseRemaining === "number" && vehicle.returnToBaseRemaining > 0) {
    return false;
  }

  if (isVehicleReserved(vehicle.id)) {
    return false;
  }

  return true;
}

function estimateTravelTimeBetweenCasernes(fromCaserne, toCaserne) {
  if (!fromCaserne || !toCaserne) {
    return 0;
  }

  const baseTime = computeTravelTimeFromDistance(
    fromCaserne.lat,
    fromCaserne.lon,
    toCaserne.lat,
    toCaserne.lon
  );

  return Math.max(5, Math.round(baseTime * 1.2));
}

function startVehicleTransfer(vehicleId, targetCaserneId) {
  const vehicle = getVehicleById(vehicleId);
  const targetCaserne = getCaserneById(targetCaserneId);
  const sourceCaserne = vehicle ? getCaserneById(vehicle.caserneId) : null;

  if (!vehicle) {
    alert("Vehicule introuvable.");
    return;
  }

  if (!targetCaserne) {
    alert("Caserne cible introuvable.");
    return;
  }

  if (!isCaserneOwned(targetCaserneId)) {
    alert("Caserne cible non debloquee.");
    return;
  }

  if (vehicle.caserneId === targetCaserneId) {
    alert("Ce vehicule est deja dans cette caserne.");
    return;
  }

  if (!canVehicleBeTransferred(vehicle)) {
    alert("Vehicule indisponible pour transfert (engage, reserve ou en transit).");
    return;
  }

  const transferDelay = estimateTravelTimeBetweenCasernes(sourceCaserne, targetCaserne);

  vehicle.transitFromCaserneId = vehicle.caserneId;
  vehicle.transitTargetCaserneId = targetCaserneId;
  vehicle.transitRemaining = transferDelay;
  vehicle.status = "TRANSIT";
  vehicle.etat = "transit_caserne";

  saveData(STORAGE_KEYS.VEHICULES, state.vehicules);
  saveState();
  renderAll();
}

function estimateDetachedReturnDelayFromMission(mission) {
  if (!mission) {
    return 0;
  }

  switch (mission.phase) {
    case "depart":
      return 0;
    case "trajet":
      return Math.max(1, Math.round((Number(mission.remaining) || Number(mission.travelTime) || 1) * 0.8));
    case "sur_place":
      return Math.max(1, Number(mission.returnTime) || 1);
    case "transport_hopital":
      return Math.max(
        1,
        (Number(mission.remaining) || 0) + (Number(mission.returnTime) || 1)
      );
    case "retour":
      return Math.max(1, Number(mission.remaining) || 1);
    default:
      return 0;
  }
}

function startDetachedVehicleReturn(vehicle, mission) {
  if (!vehicle || !mission) {
    return;
  }

  const returnDelay = estimateDetachedReturnDelayFromMission(mission);
  if (returnDelay <= 0) {
    delete vehicle.returnToBaseRemaining;
    delete vehicle.returnToBaseSp;
    syncVehicleStatusWithPhase(vehicle, "disponible");
    return;
  }

  vehicle.returnToBaseRemaining = returnDelay;
  vehicle.returnToBaseSp = Number(mission.spRequired) || 0;
  syncVehicleStatusWithPhase(vehicle, "retour");
}

function removeEngagedVehicleFromIntervention(interventionId, vehicleId) {
  const intervention = getInterventionById(interventionId);
  if (!intervention) {
    alert("Intervention introuvable.");
    return false;
  }

  const mission = state.activeMissions.find(m =>
    m.interventionId === interventionId && m.vehicleId === vehicleId
  );

  if (!mission) {
    alert("Moyen engage introuvable.");
    return false;
  }

  state.activeMissions = state.activeMissions.filter(m => m.id !== mission.id);

  const vehicle = getVehicleById(vehicleId);
  if (vehicle) {
    startDetachedVehicleReturn(vehicle, mission);
  }

  const remaining = getActiveMissionsForIntervention(interventionId);
  if (remaining.length === 0) {
    intervention.status = "ALERTE";
    intervention.isActive = false;
    intervention.engagedVehicleCount = 0;
    delete intervention.mainCoverageComplete;
    delete intervention.optionCoverageComplete;
  } else {
    intervention.isActive = true;
    intervention.engagedVehicleCount = remaining.length;
    refreshActiveMissionStatuses(interventionId);
  }

  saveState();
  renderAll();
  return true;
}

function modifyEngagedVehicleOnIntervention(interventionId, vehicleId) {
  const intervention = getInterventionById(interventionId);
  if (!intervention) {
    alert("Intervention introuvable.");
    return false;
  }

  const mission = state.activeMissions.find(m =>
    m.interventionId === interventionId && m.vehicleId === vehicleId
  );

  if (!mission) {
    alert("Moyen engage introuvable.");
    return false;
  }

  const removed = removeEngagedVehicleFromIntervention(interventionId, vehicleId);
  if (!removed) {
    return false;
  }

  const added = addVehicleToSelection(
    interventionId,
    vehicleId,
    mission.profilCode,
    mission.profilMode,
    mission.spRequired
  );

  if (!added) {
    const vehicle = getVehicleById(vehicleId);
    if (vehicle && isVehicleSelectableForIntervention(vehicle, interventionId)) {
      const selectableProfiles = getVehicleSelectableProfiles(vehicle, intervention);
      if (selectableProfiles.length > 0) {
        const fallback = selectableProfiles[0];
        addVehicleToSelection(
          interventionId,
          vehicleId,
          fallback.profil.code,
          fallback.profil.mode,
          fallback.profil.sp
        );
      }
    }
  }

  state.selectedInterventionId = interventionId;
  state.currentCenterPanel = "detail";
  saveState();
  renderAll();
  return true;
}
function adjustDelayForVehicle(vehicle, baseDelay) {

  if (vehicle.etat === "retour" && SETTINGS.REENGAGEMENT_RETOUR.enabled) {

    const adjusted = Math.round(baseDelay * SETTINGS.REENGAGEMENT_RETOUR.travelFactor);

    return Math.max(adjusted, SETTINGS.REENGAGEMENT_RETOUR.minDelay);
  }

  return baseDelay;
}

function closeInterventionDetail() {
  state.selectedInterventionId = null;
  saveState();
  renderAll();
}

function getSimulationDayLabel(totalMinutes) {
  const day = Math.floor(totalMinutes / (24 * 60)) + 1;
  return `J${day}`;
}

function getAvailableOptionSummary(intervention) {
  if (!intervention || !Array.isArray(intervention.options) || intervention.options.length === 0) {
    return {
      hasOptions: false,
      details: []
    };
  }

  const details = intervention.options.map(option => {
    const optionCode = option.code || option.type;
    const requiredQty = option.quantite || 1;

    let availableQty = 0;

    state.vehicules.forEach(vehicle => {
      if (!canUseVehicle(vehicle)) {
        return;
      }

      if (!isVehicleAvailable(vehicle)) {
        return;
      }

      const selectableProfiles = getVehicleSelectableProfiles(vehicle, intervention);

      const hasMatchingProfile = selectableProfiles.some(profileEntry => {
        const normalizedCode = profileEntry.normalizedCode || normalizeProfilCode(profileEntry.profil);
        const baseCode = profileEntry.displayCode || profileEntry.profil.code;

        return normalizedCode === optionCode || baseCode === optionCode;
      });

      if (hasMatchingProfile) {
        availableQty += 1;
      }
    });

    const displayQty = Math.min(availableQty, requiredQty);

    return {
      code: optionCode,
      quantite: requiredQty,
      label: option.label || optionCode,
      coveredQty: displayQty,
      covered: availableQty >= requiredQty
    };
  });

  return {
    hasOptions: true,
    details
  };
}

function getFeatureUnlockCost(featureKey) {
  return getProgressionConfig()?.unlockCosts?.features?.[featureKey] || 0;
}

function getCaserneUnlockCost(caserneId) {
  return getProgressionConfig()?.unlockCosts?.casernes?.[caserneId] || 0;
}

function getCustomCaserneCost() {
  return getProgressionConfig()?.unlockCosts?.customCaserne || 0;
}

function getLevelOneStaffingDefaults() {
  const cfg = getProgressionConfig()?.caserneLevel1Staffing || {};
  const poste = Math.max(0, Math.floor(Number(cfg.poste) || 0));
  const astreinte = Math.max(0, Math.floor(Number(cfg.astreinte) || 3));
  return { poste, astreinte };
}

function getCaserneLevelsConfig() {
  return getProgressionConfig()?.caserneLevels || {};
}

function getMaxCaserneLevel() {
  const levels = Object.keys(getCaserneLevelsConfig())
    .map(value => Number(value))
    .filter(value => Number.isFinite(value));
  if (levels.length === 0) {
    return 1;
  }
  return Math.max(...levels);
}

function getCaserneLevelSpec(level) {
  const levels = getCaserneLevelsConfig();
  const raw = levels[level] || levels[String(level)] || null;
  if (!raw) {
    return null;
  }

  return {
    level: Number(level),
    poste: Math.max(0, Math.floor(Number(raw.poste) || 0)),
    astreinte: Math.max(0, Math.floor(Number(raw.astreinte) || 0)),
    bayCapacity: Math.max(1, Math.floor(Number(raw.bayCapacity) || 1)),
    postedGuardUnlocked: !!raw.postedGuardUnlocked,
    upgradeCost: Math.max(0, Math.floor(Number(raw.upgradeCost) || 0))
  };
}

function getCaserneUpgradeCost(caserneId) {
  const currentLevel = getCaserneLevel(caserneId);
  if (currentLevel <= 0) {
    return null;
  }
  const nextLevel = currentLevel + 1;
  const nextSpec = getCaserneLevelSpec(nextLevel);
  if (!nextSpec) {
    return null;
  }
  return nextSpec.upgradeCost;
}

function getPostedGuardUnlockMinLevel() {
  const raw = Number(getProgressionConfig()?.unlockCosts?.postedGuard?.minLevel);
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 3;
}

function getPostedGuardUnlockCost(caserneId) {
  const map = getProgressionConfig()?.unlockCosts?.postedGuard?.casernes || {};
  const defaultCostRaw = Number(getProgressionConfig()?.unlockCosts?.postedGuard?.defaultCost);
  const defaultCost = Number.isFinite(defaultCostRaw) && defaultCostRaw >= 0 ? Math.floor(defaultCostRaw) : 8000;
  const specificCost = Number(map?.[caserneId]);
  return Number.isFinite(specificCost) && specificCost >= 0 ? Math.floor(specificCost) : defaultCost;
}

function applyCaserneLevelSpec(caserne, level, options = {}) {
  if (!caserne) {
    return false;
  }

  const spec = getCaserneLevelSpec(level);
  if (!spec) {
    return false;
  }

  const defaults = getLevelOneStaffingDefaults();
  const preserveCurrent = options.preserveCurrent === true;
  const initialPoste = Number(options.initialPoste);
  const initialAstreinte = Number(options.initialAstreinte);
  const requestedPoste = Number.isFinite(initialPoste) ? Math.floor(initialPoste) : defaults.poste;
  const requestedAstreinte = Number.isFinite(initialAstreinte) ? Math.floor(initialAstreinte) : defaults.astreinte;

  const currentPoste = preserveCurrent
    ? Number(caserne.sp_poste) || 0
    : Math.max(0, requestedPoste);
  const currentAstreinte = preserveCurrent
    ? Number(caserne.sp_astreinte) || 0
    : Math.max(0, requestedAstreinte);

  const posteValue = Math.min(spec.poste, Math.max(0, currentPoste));
  const astreinteValue = Math.min(spec.astreinte, Math.max(0, currentAstreinte));

  caserne.effectifs = {
    poste: {
      min: posteValue,
      max: posteValue,
      current: posteValue
    },
    astreinte: {
      min: astreinteValue,
      max: astreinteValue,
      current: astreinteValue
    }
  };
  caserne.sp_poste = caserne.effectifs.poste.current;
  caserne.sp_astreinte = caserne.effectifs.astreinte.current;
  caserne.bayCapacity = spec.bayCapacity;
  const minLevel = getPostedGuardUnlockMinLevel();
  const postedGuardPurchased = !!caserne.postedGuardPurchased;
  caserne.postedGuardUnlocked = postedGuardPurchased && level >= minLevel;

  return true;
}

function getCaserneVehicleCapacity(caserneId) {
  const caserne = getCaserneById(caserneId);
  if (!caserne) {
    return 1;
  }

  const rawCapacity = Number(caserne.bayCapacity);
  if (Number.isFinite(rawCapacity) && rawCapacity > 0) {
    return Math.floor(rawCapacity);
  }

  const level = getCaserneLevel(caserneId);
  const levelSpec = getCaserneLevelSpec(level);
  return levelSpec ? levelSpec.bayCapacity : 1;
}

function getCaserneUpgradeInfo(caserneId) {
  const caserne = getCaserneById(caserneId);
  const currentLevel = getCaserneLevel(caserneId);
  const maxLevel = getMaxCaserneLevel();
  const currentSpec = getCaserneLevelSpec(currentLevel);
  const nextLevel = currentLevel + 1;
  const nextSpec = getCaserneLevelSpec(nextLevel);
  const upgradeCost = nextSpec ? nextSpec.upgradeCost : null;
  const currentVehicles = state.vehicules.filter(vehicle =>
    vehicle.caserneId === caserneId && isVehicleOwned(vehicle.id)
  ).length;
  const bayCapacity = getCaserneVehicleCapacity(caserneId);
  const postedGuardMinLevel = getPostedGuardUnlockMinLevel();
  const postedGuardUnlockCost = getPostedGuardUnlockCost(caserneId);
  const postedGuardPurchased = !!caserne?.postedGuardPurchased;
  const canUnlockPostedGuard = !!(caserne &&
    currentLevel >= postedGuardMinLevel &&
    !postedGuardPurchased &&
    canAfford(postedGuardUnlockCost));
  const canUpgrade = !!(caserne &&
    currentLevel > 0 &&
    nextSpec &&
    canAfford(upgradeCost || 0));

  return {
    caserneId,
    caserne,
    currentLevel,
    nextLevel: nextSpec ? nextLevel : null,
    maxLevel,
    currentSpec,
    nextSpec,
    upgradeCost,
    currentVehicles,
    bayCapacity,
    postedGuardMinLevel,
    postedGuardPurchased,
    postedGuardUnlockCost,
    canUnlockPostedGuard,
    canUpgrade
  };
}

function getCaserneStaffingUnitCost(staffingType) {
  const costs = getProgressionConfig()?.unlockCosts?.staffingUnits || {};
  const defaultCost = staffingType === "poste" ? 2500 : 1200;
  const raw = Number(costs?.[staffingType]);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : defaultCost;
}

function buyCaserneStaffing(caserneId, staffingType) {
  if (!isProgressionEnabled()) {
    return false;
  }

  if (!isCaserneOwned(caserneId)) {
    alert("Caserne non debloquee.");
    return false;
  }

  if (staffingType !== "poste" && staffingType !== "astreinte") {
    alert("Type d'effectif inconnu.");
    return false;
  }

  const caserne = getCaserneById(caserneId);
  const level = getCaserneLevel(caserneId);
  const spec = getCaserneLevelSpec(level);
  if (!caserne || !spec) {
    alert("Caserne invalide.");
    return false;
  }

  if (staffingType === "poste" && !caserne.postedGuardUnlocked) {
    alert("Garde postee non debloquee a ce niveau.");
    return false;
  }

  const current = staffingType === "poste"
    ? Math.max(0, Math.floor(Number(caserne.sp_poste) || 0))
    : Math.max(0, Math.floor(Number(caserne.sp_astreinte) || 0));
  const maxAllowed = staffingType === "poste" ? spec.poste : spec.astreinte;

  if (current >= maxAllowed) {
    alert(`Maximum atteint pour ${staffingType}.`);
    return false;
  }

  const cost = getCaserneStaffingUnitCost(staffingType);
  if (!spendMoney(cost)) {
    alert("Fonds insuffisants.");
    return false;
  }

  const nextValue = current + 1;
  if (!caserne.effectifs) {
    caserne.effectifs = {};
  }
  if (!caserne.effectifs[staffingType]) {
    caserne.effectifs[staffingType] = {
      min: nextValue,
      max: nextValue,
      current: nextValue
    };
  } else {
    caserne.effectifs[staffingType].min = nextValue;
    caserne.effectifs[staffingType].max = nextValue;
    caserne.effectifs[staffingType].current = nextValue;
  }

  if (staffingType === "poste") {
    caserne.sp_poste = nextValue;
  } else {
    caserne.sp_astreinte = nextValue;
  }

  saveState();
  renderAll();
  return true;
}

function unlockPostedGuardForCaserne(caserneId) {
  if (!isProgressionEnabled()) {
    return false;
  }
  if (!isCaserneOwned(caserneId)) {
    alert("Caserne non debloquee.");
    return false;
  }

  const caserne = getCaserneById(caserneId);
  const level = getCaserneLevel(caserneId);
  const minLevel = getPostedGuardUnlockMinLevel();
  if (!caserne) {
    alert("Caserne invalide.");
    return false;
  }
  if (caserne.postedGuardPurchased) {
    return false;
  }
  if (level < minLevel) {
    alert(`Niveau ${minLevel} requis.`);
    return false;
  }

  const cost = getPostedGuardUnlockCost(caserneId);
  if (!spendMoney(cost)) {
    alert("Fonds insuffisants.");
    return false;
  }

  caserne.postedGuardPurchased = true;
  caserne.postedGuardUnlocked = true;
  saveState();
  renderAll();
  return true;
}

function getVehicleTypeUnlockCost(type) {
  return getProgressionConfig()?.unlockCosts?.vehicleTypeUnlock?.[type] || 0;
}

function getVehicleUnitCostByType(type) {
  return getProgressionConfig()?.unlockCosts?.vehicleByType?.[type] || 10000;
}

function getVehicleUnlockCost(vehicle) {
  return vehicle ? getVehicleUnitCostByType(vehicle.type) : 0;
}

function getUnlockedVehicleTypes() {
  if (!isProgressionEnabled()) {
    return Object.keys(VEHICULE_TYPES || {});
  }

  return (getProgressionState()?.unlockedVehicleTypes || []).slice();
}

function getLockedVehicleTypes() {
  const allTypes = Object.keys(VEHICULE_TYPES || {});
  const unlocked = new Set(getUnlockedVehicleTypes());
  return allTypes.filter(type => !unlocked.has(type));
}

function canAfford(amount) {
  const progression = getProgressionState();
  if (!progression) {
    return false;
  }

  return progression.money >= amount;
}

function spendMoney(amount) {
  const progression = getProgressionState();
  if (!progression) {
    return false;
  }

  if (!canAfford(amount)) {
    return false;
  }

  progression.money -= amount;
  return true;
}

function awardMoney(amount, context = {}) {
  const progression = getProgressionState();
  if (!progression) {
    return;
  }

  progression.money += amount;
  progression.totalRevenue += amount;
  progression.lastReward = {
    amount,
    interventionLabel: context.interventionLabel || null,
    reason: context.reason || "Intervention terminee",
    simulationMinutes: state.simulationMinutes,
    qualityScore: typeof context.qualityScore === "number" ? context.qualityScore : null,
    qualityMoneyDelta: typeof context.qualityMoneyDelta === "number" ? context.qualityMoneyDelta : 0,
    qualityBreakdown: context.qualityBreakdown || null
  };

  progression.rewardHistory = Array.isArray(progression.rewardHistory) ? progression.rewardHistory : [];
  progression.rewardHistory.unshift({ ...progression.lastReward });
  progression.rewardHistory = progression.rewardHistory.slice(0, 50);
}

function computeDispatchQuality(intervention) {
  const quality = getProgressionConfig()?.quality || {};

  const dispatchDelay = Math.max(
    0,
    (intervention?.engagedAtSimulationMinutes ?? state.simulationMinutes) -
    (intervention?.createdAtSimulationMinutes ?? state.simulationMinutes)
  );

  const requiredVehicleBaseline = Math.max(
    1,
    intervention?.requiredVehicleBaseline ||
      (intervention?.besoins || []).reduce((sum, besoin) => sum + (besoin.quantite || 1), 0)
  );

  const engagedVehicleCount = Math.max(
    1,
    intervention?.engagedVehicleCount || requiredVehicleBaseline
  );

  const overEngagementCount = Math.max(0, engagedVehicleCount - requiredVehicleBaseline);

  const baseScore = quality.baseScore || 50;
  let score = baseScore;
  let coverageDelta = 0;
  let dispatchDelta = 0;

  if (intervention?.status === "ENGAGEMENT_COMPLET") {
    coverageDelta = quality.completeCoverageBonus || 0;
  } else {
    coverageDelta = -(quality.partialCoveragePenalty || 0);
  }
  score += coverageDelta;

  if (dispatchDelay <= (quality.fastDispatchThresholdMinutes || 0)) {
    dispatchDelta = quality.fastDispatchBonus || 0;
  } else if (dispatchDelay >= (quality.slowDispatchThresholdMinutes || Number.MAX_SAFE_INTEGER)) {
    dispatchDelta = -(quality.slowDispatchPenalty || 0);
  }
  score += dispatchDelta;

  const overEngagementPenaltyPoints = overEngagementCount * (quality.overEngagementPenaltyPerVehicle || 0);
  score -= overEngagementPenaltyPoints;
  score = clamp(Math.round(score), 0, 100);

  const qualityMoneyDelta = Math.round(
    (score - baseScore) * (quality.moneyPerPointFromBase || 0)
  );

  return {
    score,
    dispatchDelay,
    engagedVehicleCount,
    requiredVehicleBaseline,
    overEngagementCount,
    qualityMoneyDelta,
    breakdown: {
      baseScore,
      coverageDelta,
      dispatchDelta,
      overEngagementPenaltyPoints
    }
  };
}

function computeInterventionReward(intervention) {
  const rewards = getProgressionConfig()?.rewards || {};
  const requiredUnits = (intervention?.besoins || []).reduce((sum, need) => {
    return sum + (need.quantite || 1);
  }, 0);

  const qualitySummary = computeDispatchQuality(intervention);
  const dispatchDelay = qualitySummary.dispatchDelay;

  let amount = (rewards.base || 0) + (requiredUnits * (rewards.perNeedUnit || 0));

  if (intervention?.status === "ENGAGEMENT_COMPLET") {
    amount += rewards.completeBonus || 0;
  } else {
    amount += rewards.partialBonus || 0;
  }

  if (dispatchDelay <= (rewards.fastDispatchThresholdMinutes || 0)) {
    amount += rewards.fastDispatchBonus || 0;
  } else if (dispatchDelay >= (rewards.slowDispatchThresholdMinutes || Number.MAX_SAFE_INTEGER)) {
    amount -= rewards.slowDispatchPenalty || 0;
  }

  amount += qualitySummary.qualityMoneyDelta;

  const minReward = rewards.minReward || 0;
  return {
    amount: Math.max(minReward, amount),
    dispatchDelay,
    quality: qualitySummary
  };
}

function finalizeCompletedInterventions() {
  const completedInterventions = state.interventions.filter(intervention =>
    intervention.isActive &&
    !state.activeMissions.some(mission => mission.interventionId === intervention.id)
  );

  completedInterventions.forEach(intervention => {
    const reward = computeInterventionReward(intervention);

    awardMoney(reward.amount, {
      interventionLabel: intervention.type,
      reason: `${intervention.type} (${reward.dispatchDelay} min avant engagement)`,
      qualityScore: reward.quality.score,
      qualityMoneyDelta: reward.quality.qualityMoneyDelta,
      qualityBreakdown: reward.quality.breakdown
    });

    if (state.progression) {
      state.progression.completedInterventions += 1;
      state.progression.qualityTotalScore += reward.quality.score;
      state.progression.qualityRunCount += 1;
      state.progression.bestQualityScore = state.progression.bestQualityScore === null
        ? reward.quality.score
        : Math.max(state.progression.bestQualityScore, reward.quality.score);
      state.progression.worstQualityScore = state.progression.worstQualityScore === null
        ? reward.quality.score
        : Math.min(state.progression.worstQualityScore, reward.quality.score);

      if (reward.quality.qualityMoneyDelta >= 0) {
        state.progression.totalQualityBonus += reward.quality.qualityMoneyDelta;
      } else {
        state.progression.totalQualityPenalty += Math.abs(reward.quality.qualityMoneyDelta);
      }
    }

    intervention.status = "TERMINEE";
    intervention.isActive = false;
  });

  state.interventions = state.interventions.filter(intervention => intervention.status !== "TERMINEE");
}

function unlockCaserne(caserneId) {
  if (!isProgressionEnabled()) {
    return;
  }

  const progression = getProgressionState();

  if (isCaserneOwned(caserneId)) {
    return;
  }

  const cost = getCaserneUnlockCost(caserneId);
  if (!spendMoney(cost)) {
    alert("Fonds insuffisants.");
    return;
  }

  const caserne = getCaserneById(caserneId);
  const defaults = getLevelOneStaffingDefaults();
  applyCaserneLevelSpec(caserne, 1, {
    preserveCurrent: false,
    initialPoste: defaults.poste,
    initialAstreinte: defaults.astreinte
  });

  progression.ownedCaserneIds.push(caserneId);
  progression.caserneLevels = progression.caserneLevels || {};
  progression.caserneLevels[caserneId] = 1;
  saveState();
  renderAll();
}

function upgradeCaserneLevel(caserneId) {
  if (!isProgressionEnabled()) {
    return false;
  }

  if (!isCaserneOwned(caserneId)) {
    alert("Caserne non debloquee.");
    return false;
  }

  const progression = getProgressionState();
  const currentLevel = getCaserneLevel(caserneId);
  const nextLevel = currentLevel + 1;
  const nextSpec = getCaserneLevelSpec(nextLevel);
  if (!nextSpec) {
    alert("Niveau maximal atteint.");
    return false;
  }

  const upgradeCost = getCaserneUpgradeCost(caserneId) || 0;
  if (!spendMoney(upgradeCost)) {
    alert("Fonds insuffisants.");
    return false;
  }

  const caserne = getCaserneById(caserneId);
  applyCaserneLevelSpec(caserne, nextLevel, { preserveCurrent: true });

  progression.caserneLevels = progression.caserneLevels || {};
  progression.caserneLevels[caserneId] = nextLevel;

  saveState();
  renderAll();
  return true;
}

function parseCoordinateValue(value) {
  if (typeof value === "number") {
    return value;
  }

  const normalized = String(value || "").trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function createCustomCaserne({ nom, lat, lon, spPoste, spAstreinte }) {
  if (!nom || String(nom).trim().length < 3) {
    alert("Nom de caserne invalide (minimum 3 caracteres).");
    return false;
  }

  const parsedLat = parseCoordinateValue(lat);
  const parsedLon = parseCoordinateValue(lon);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLon)) {
    alert("Coordonnees invalides.");
    return false;
  }

  if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
    alert("Coordonnees hors limites.");
    return false;
  }

  const defaults = getLevelOneStaffingDefaults();
  const poste = defaults.poste;
  const astreinte = defaults.astreinte;

  const customCost = getCustomCaserneCost();
  if (isProgressionEnabled() && customCost > 0 && !spendMoney(customCost)) {
    alert("Fonds insuffisants.");
    return false;
  }

  const progression = getProgressionState();
  const rawBase = String(nom).trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const baseId = rawBase || "CUSTOM";

  let nextIndex = 1;
  let generatedId = `CUS_${baseId}`;
  while (state.casernes.some(caserne => caserne.id === generatedId)) {
    generatedId = `CUS_${baseId}_${String(nextIndex).padStart(2, "0")}`;
    nextIndex += 1;
  }

  const newCaserne = {
    id: generatedId,
    nom: String(nom).trim(),
    lat: parsedLat,
    lon: parsedLon,
    isCustom: true,
    effectifs: {
      poste: {
        min: poste,
        max: poste,
        current: poste
      },
      astreinte: {
        min: astreinte,
        max: astreinte,
        current: astreinte
      }
    },
    sp_poste: poste,
    sp_astreinte: astreinte
  };

  applyCaserneLevelSpec(newCaserne, 1, { preserveCurrent: false });

  state.casernes.push(newCaserne);

  if (isProgressionEnabled() && progression) {
    if (!progression.ownedCaserneIds.includes(generatedId)) {
      progression.ownedCaserneIds.push(generatedId);
    }
    progression.caserneLevels = progression.caserneLevels || {};
    progression.caserneLevels[generatedId] = 1;
  }

  saveState();
  renderAll();
  return true;
}

function unlockVehicleType(type) {
  if (!isProgressionEnabled()) {
    return;
  }

  const progression = getProgressionState();
  if (!VEHICULE_TYPES[type]) {
    alert("Type de vehicule inconnu.");
    return;
  }

  if (isVehicleTypeUnlocked(type)) {
    return;
  }

  const cost = getVehicleTypeUnlockCost(type);
  if (!spendMoney(cost)) {
    alert("Fonds insuffisants.");
    return;
  }

  progression.unlockedVehicleTypes.push(type);
  saveState();
  renderAll();
}

function buyVehicleByType(type, caserneId) {
  if (!isProgressionEnabled()) {
    return;
  }

  const progression = getProgressionState();

  if (!VEHICULE_TYPES[type]) {
    alert("Type de vehicule inconnu.");
    return;
  }

  if (!isVehicleTypeUnlocked(type)) {
    alert("Type non debloque.");
    return;
  }

  if (!isCaserneOwned(caserneId)) {
    alert("Caserne non debloquee.");
    return;
  }

  const bayCapacity = getCaserneVehicleCapacity(caserneId);
  const currentFleetCount = state.vehicules.filter(vehicle =>
    vehicle.caserneId === caserneId && isVehicleOwned(vehicle.id)
  ).length;
  if (currentFleetCount >= bayCapacity) {
    alert(`Remise pleine (${currentFleetCount}/${bayCapacity}). Augmente le niveau de la caserne.`);
    return;
  }

  const cost = getVehicleUnitCostByType(type);
  if (!spendMoney(cost)) {
    alert("Fonds insuffisants.");
    return;
  }

  const currentCounter = progression.vehiclePurchaseCounters[type] || 0;
  let nextCounter = currentCounter + 1;
  let suffix = String(nextCounter).padStart(3, "0");
  let id = `BUY_${type}_${suffix}`;
  while (state.vehicules.some(vehicle => vehicle.id === id)) {
    nextCounter += 1;
    suffix = String(nextCounter).padStart(3, "0");
    id = `BUY_${type}_${suffix}`;
  }
  progression.vehiclePurchaseCounters[type] = nextCounter;

  const nom = `${type} ${suffix}`;

  state.vehicules.push({
    id,
    nom,
    type,
    caserneId,
    status: "DISPO",
    etat: "disponible"
  });

  progression.ownedVehicleIds.push(id);

  saveData(STORAGE_KEYS.VEHICULES, state.vehicules);
  saveState();
  renderAll();
}

function unlockFeature(featureKey) {
  if (!isProgressionEnabled()) {
    return;
  }

  const progression = getProgressionState();
  if (hasFeatureUnlocked(featureKey)) {
    return;
  }

  const cost = getFeatureUnlockCost(featureKey);
  if (!spendMoney(cost)) {
    alert("Fonds insuffisants.");
    return;
  }

  progression.unlockedFeatures[featureKey] = true;
  saveState();
  renderAll();
}

window.isVehicleAvailable = isVehicleAvailable;
window.isVehicleReserved = isVehicleReserved;
window.getInterventionStatusLabel = getInterventionStatusLabel;
window.getActiveMissionsForIntervention = getActiveMissionsForIntervention;
window.openActiveIntervention = openActiveIntervention;
window.removeEngagedVehicleFromIntervention = removeEngagedVehicleFromIntervention;
window.modifyEngagedVehicleOnIntervention = modifyEngagedVehicleOnIntervention;
window.closeInterventionDetail = closeInterventionDetail;
window.getSimulationDayLabel = getSimulationDayLabel;
window.isProgressionEnabled = isProgressionEnabled;
window.isCaserneOwned = isCaserneOwned;
window.isVehicleOwned = isVehicleOwned;
window.getCaserneLevel = getCaserneLevel;
window.canUseVehicle = canUseVehicle;
window.getOwnedCasernes = getOwnedCasernes;
window.getOwnedVehicles = getOwnedVehicles;
window.hasFeatureUnlocked = hasFeatureUnlocked;
window.getCaserneUnlockCost = getCaserneUnlockCost;
window.getCaserneUpgradeCost = getCaserneUpgradeCost;
window.getCaserneUpgradeInfo = getCaserneUpgradeInfo;
window.getPostedGuardUnlockCost = getPostedGuardUnlockCost;
window.getPostedGuardUnlockMinLevel = getPostedGuardUnlockMinLevel;
window.getCaserneStaffingUnitCost = getCaserneStaffingUnitCost;
window.getCaserneVehicleCapacity = getCaserneVehicleCapacity;
window.getCustomCaserneCost = getCustomCaserneCost;
window.isVehicleTypeUnlocked = isVehicleTypeUnlocked;
window.getUnlockedVehicleTypes = getUnlockedVehicleTypes;
window.getLockedVehicleTypes = getLockedVehicleTypes;
window.getVehicleTypeUnlockCost = getVehicleTypeUnlockCost;
window.getVehicleUnitCostByType = getVehicleUnitCostByType;
window.getVehicleUnlockCost = getVehicleUnlockCost;
window.getFeatureUnlockCost = getFeatureUnlockCost;
window.getRoutingProvider = getRoutingProvider;
window.getInfluencePopulationByCaserneId = getInfluencePopulationByCaserneId;
window.getInfluenceZoneCountByCaserneId = getInfluenceZoneCountByCaserneId;
window.canVehicleBeTransferred = canVehicleBeTransferred;
window.startVehicleTransfer = startVehicleTransfer;
window.unlockCaserne = unlockCaserne;
window.upgradeCaserneLevel = upgradeCaserneLevel;
window.unlockPostedGuardForCaserne = unlockPostedGuardForCaserne;
window.buyCaserneStaffing = buyCaserneStaffing;
window.createCustomCaserne = createCustomCaserne;
window.unlockVehicleType = unlockVehicleType;
window.buyVehicleByType = buyVehicleByType;
window.unlockFeature = unlockFeature;
