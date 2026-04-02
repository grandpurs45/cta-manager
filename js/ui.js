function getVehicleStateLabel(etat) {
  switch (etat) {
    case "disponible":
      return "disponible";
    case "depart":
      return "départ";
    case "trajet":
      return "trajet";
    case "sur_place":
      return "sur place";
    case "retour":
      return "retour";
    default:
      return etat;
  }
}

function getMissionPhaseLabel(phase) {
  switch (phase) {
    case "depart":
      return "alerté";
    case "trajet":
      return "parti";
    case "sur_place":
      return "sur place";
    case "retour":
      return "retour";
    case "transport_hopital":
      return "transport hôpital";
    default:
      return phase;
  }
}

function getInterventionStatusBadge(status) {
  switch (status) {
    case "ALERTE":
      return `<span class="badge" style="background:#334155;color:#e2e8f0;">Alerte</span>`;
    case "ENGAGEMENT_PARTIEL":
      return `<span class="badge" style="background:#92400e;color:#fef3c7;">Engagement partiel</span>`;
    case "ENGAGEMENT_COMPLET":
      return `<span class="badge" style="background:#166534;color:#dcfce7;">Engagement complet</span>`;
    case "RENFORT_EN_COURS":
      return `<span class="badge" style="background:#1d4ed8;color:#dbeafe;">Renfort en cours</span>`;
    case "TERMINEE":
      return `<span class="badge" style="background:#4b5563;color:#f3f4f6;">Terminée</span>`;
    default:
      return `<span class="badge" style="background:#374151;color:#f3f4f6;">${status || "Inconnu"}</span>`;
  }
}

function renderCoverageBadge(status) {
  if (status === "complete") {
    return `<span class="coverage-badge coverage-badge--complete">Couverture complète</span>`;
  }

  if (status === "partial") {
    return `<span class="coverage-badge coverage-badge--partial">Couverture partielle</span>`;
  }

  return `<span class="coverage-badge coverage-badge--invalid">Engagement incomplet</span>`;
}

function renderCoverageList(details = []) {
  if (!details.length) {
    return `<div class="coverage-empty">Aucun élément</div>`;
  }

  return details.map(detail => `
    <div class="coverage-line">
      <span class="coverage-icon">${detail.covered ? "OK" : "KO"}</span>
      <span class="coverage-label">${detail.label || detail.code}</span>
      <span class="coverage-qty">
        ${detail.coveredQty || 0}/${detail.quantite || 1}
      </span>
    </div>
  `).join("");
}

function normalizeDisplayText(value) {
  if (typeof value !== "string" || value.length === 0) {
    return value;
  }

  return value
    .replace(/[\u0080-\u009F]/g, "")
    .replace(/\uFFFD/g, "");
}
function normalizeUiText() {
  const root = document.body;
  if (!root) {
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach(node => {
    node.nodeValue = normalizeDisplayText(node.nodeValue || "");
  });
}

function renderTopbar() {
  document.getElementById("simTime").textContent = formatTime(state.simulationMinutes);
  document.getElementById("activeCount").textContent = state.activeMissions.length;
  document.getElementById("pendingCount").textContent =
    state.interventions.filter(intervention => !intervention.isActive).length;
  document.getElementById("simDay").textContent = getSimulationDayLabel(state.simulationMinutes);

  const moneyEl = document.getElementById("simMoney");
  const completedEl = document.getElementById("completedCount");
  const progression = state.progression;
  if (moneyEl && progression) {
    moneyEl.textContent = `${Math.floor(progression.money).toLocaleString("fr-FR")} \u20AC`;
  }
  if (completedEl && progression) {
    completedEl.textContent = progression.completedInterventions;
  }

  const pauseButton = document.getElementById("btnPause");
  if (pauseButton) {
    pauseButton.textContent = state.isPaused ? "Reprendre" : "Pause";
  }

  const simStatus = document.getElementById("simStatus");
  if (simStatus) {
    simStatus.textContent = state.isPaused ? "PAUSE" : "EN COURS";
    simStatus.className = state.isPaused ? "sim-status paused" : "sim-status running";
  }

  const modeBadge = document.getElementById("installationModeBadge");
  if (modeBadge) {
    const mode = state?.installation?.mode || "offline";
    const isOnline = mode === "online";
    modeBadge.textContent = isOnline ? "Mode online (profil cloud)" : "Mode offline (sauvegarde locale)";
    modeBadge.className = `mode-badge ${isOnline ? "mode-online" : "mode-offline"}`;
  }
}

function renderInterventions() {
  const container = document.getElementById("interventionsList");

  const pendingInterventions = state.interventions.filter(intervention => !intervention.isActive);

  if (pendingInterventions.length === 0) {
    container.innerHTML = `<p class="empty">Aucune intervention en attente.</p>`;
    return;
  }

  const interventionsSorted = [...pendingInterventions].sort((a, b) => {
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  container.innerHTML = interventionsSorted.map(intervention => {
    const selectedClass = intervention.id === state.selectedInterventionId ? "intervention-selected" : "";

    return `
      <div class="card ${selectedClass}">
        <h3>${intervention.type}</h3>
        <p>
          <span class="badge badge-type">${intervention.zone}</span>
          ${getInterventionStatusBadge(intervention.status)}
        </p>
        <p class="muted">
          ${intervention.isActive ? "Intervention déjà engagée" : `Temps sur place estimé : ${intervention.dureeSurPlace} min`}
        </p>
        <button onclick="selectIntervention('${intervention.id}')">Voir détail</button>
      </div>
    `;
  }).join("");
}

function renderDetail() {
  const container = document.getElementById("detailPanel");
  const intervention = state.interventions.find(i => i.id === state.selectedInterventionId);
  

  if (!intervention) {
    container.innerHTML = `<div class="empty">Sélectionne une intervention.</div>`;
    return;
  }

  const zone = getZoneById(intervention.zoneId);
  const selectedItems = getSelectedItemsForIntervention(intervention.id);
  const activeMissions = getActiveMissionsForIntervention(intervention.id);
  const evaluation = evaluateSelection(intervention.id);

  const mandatoryHtml = renderCoverageList(evaluation?.coverageSummary?.details || []);
  const optionSummary = evaluation?.optionCoverageSummary || { hasOptions: false, details: [] };
  const optionsHtml = renderCoverageList(optionSummary.details || []);
  const statusHtml = renderCoverageBadge(evaluation?.status || "invalid");

  const selectedVehicleIds = new Set(selectedItems.map(item => item.vehicle.id));
  const missingNeedCodes = getMissingNeedCodes(intervention.id);

  const availableVehicles = state.vehicules
    .filter(vehicle => canUseVehicle(vehicle))
    .filter(vehicle => isVehicleAvailable(vehicle))
    .filter(vehicle => !selectedVehicleIds.has(vehicle.id))
    .map(vehicle => {
      const caserne = getCaserneById(vehicle.caserneId);
      const profils = getVehicleSelectableProfiles(vehicle, intervention).map(profile => {
      const helpsMainNeed = profileHelpsMissingNeeds(profile, missingNeedCodes);
      const helpsOption = profileHelpsOptionalNeed(profile, intervention);

      return {
        ...profile,
        helpsMissing: helpsMainNeed,
        helpsOption
      };
    });

      const distanceKm = caserne && zone
        ? calculateDistanceKm(caserne.lat, caserne.lon, zone.lat, zone.lon)
        : Number.POSITIVE_INFINITY;

      const helpsMissing = profils.some(profile => profile.helpsMissing);
      const helpsOption = profils.some(profile => profile.helpsOption);

      return {
        vehicle,
        caserne,
        profils,
        distanceKm,
        helpsMissing,
        helpsOption
      };
    })
    .filter(entry => entry.profils.length > 0)
    .sort((a, b) => {
      if (a.helpsOption !== b.helpsOption) {
        return a.helpsOption ? -1 : 1;
      }

      if (a.helpsMissing !== b.helpsMissing) {
        return a.helpsMissing ? -1 : 1;
      }

      return a.distanceKm - b.distanceKm;
    });
    const recommendedVehicles = availableVehicles
    .filter(entry => entry.helpsMissing || entry.helpsOption)
    .slice(0, 3)
    .map(entry => {
      if (entry.helpsMissing) {
        return `${entry.vehicle.nom} (besoin principal)`;
      }

      if (entry.helpsOption) {
        return `${entry.vehicle.nom} (PS utile)`;
      }

      return entry.vehicle.nom;
    });

    let html = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
        <button class="btn btn-secondary" onclick="closeInterventionDetail()">Fermer</button>
      </div>

      <div class="card">
        <h3>${intervention.type}</h3>
        <p><strong>Zone :</strong> ${intervention.zone}</p>
        <p><strong>Statut :</strong> ${getInterventionStatusLabel(intervention.status)}</p>
        <p><strong>Besoins :</strong> ${intervention.besoins.map(b => `${b.quantite} ${b.code}`).join(", ")}</p>
        ${intervention.transportRequired ? `<p><strong>Transport hôpital :</strong> Oui${intervention.hospitalName ? ` (${intervention.hospitalName})` : ""}</p>` : ""}
        <p><strong>Temps sur place :</strong> ${intervention.dureeSurPlace} min</p>
      </div>
    `;

  
    if (activeMissions.length > 0) {
      html += `
        <div class="card">
          <h4>Moyens déjà engagés</h4>
          <div class="dispatch-selection-list">
            ${activeMissions.map(mission => `
              <div class="dispatch-selected-line">
                <div>
                  <strong>${mission.vehicleLabel}</strong><br>
                  <span class="muted">${mission.profilCode} / ${mission.spRequired} SP / ${mission.profilMode} / ${mission.caserneLabel}</span><br>
                  <span class="muted">Phase : ${getMissionPhaseLabel(mission.phase)}</span>
                </div>
                <div class="panel-actions">
                  <button onclick="removeEngagedVehicleFromIntervention('${intervention.id}', '${mission.vehicleId}')">Retirer</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

  const missingLabel = missingNeedCodes.length > 0
  ? missingNeedCodes.join(", ")
  : "Aucun";

  html += `
    <div class="card">
      <h4>Décision CTA</h4>
      <p><strong>Besoin principal :</strong> ${intervention.besoins.map(b => `${b.quantite} ${b.code}`).join(", ")}</p>
      <p><strong>Manque actuel :</strong> ${missingLabel}</p>
      <p><strong>Objectif :</strong> sélectionner les moyens minimaux couvrant le besoin.</p>
    </div>
  `;

  if (evaluation) {
    html += `
      <div class="card">
        <h4>Synoptique opérationnel</h4>

        <div class="engagement-coverage-box">
          <div class="engagement-coverage-title">Besoins obligatoires</div>
          ${mandatoryHtml}
        </div>

        ${optionSummary?.hasOptions ? `
          <div class="engagement-coverage-box">
            <div class="engagement-coverage-title">Options engagées / sélectionnées</div>
            ${optionsHtml}
          </div>
        ` : ""}

        <div class="engagement-coverage-status">
          <div class="engagement-coverage-title">Statut</div>
          ${statusHtml}
        </div>

        <div class="dispatch-need-grid">
          ${evaluation.coverageSummary.details.map(detail => `
            <div class="dispatch-need-tile ${detail.covered ? "dispatch-need-ok" : "dispatch-need-missing"}">
              <div class="dispatch-need-code">${detail.code}</div>
              <div>${detail.covered ? "✅ Couvert" : "❌ Manquant"}</div>
              ${detail.ruleLabel ? `<div class="dispatch-need-rule">${detail.ruleLabel}</div>` : ""}
            </div>
          `).join("")}
        </div>

        ${evaluation.status === "partial" ? `
          <div class="coverage-alert">
            ⚠ Couverture partielle : un moyen facultatif est engagé, mais le besoin principal reste à couvrir.
          </div>
        ` : ""}

        ${!evaluation.coverageSummary.covered && evaluation.status !== "partial" ? `
          <div class="coverage-alert">
            ⚠ Tous les besoins ne sont pas encore couverts.
          </div>
        ` : ""}

        ${evaluation.reasons && evaluation.reasons.length > 0 ? `
          <div class="dispatch-alert-list">
            ${evaluation.reasons.map(reason => `
              <div class="dispatch-alert-item">
                ⚠ ${reason}
              </div>
            `).join("")}
          </div>
        ` : ""}

        <p><strong>Délai estimé :</strong> ${evaluation.totalDelay !== null ? `${evaluation.totalDelay} min` : "-"}</p>
        <p>
          <strong>Engageable :</strong>
          <span class="${evaluation.canEngage ? "coverage-ok" : "coverage-missing"}">
            ${evaluation.canEngage ? "Oui" : "Non"}
          </span>
        </p>
      </div>
    `;
  }

  html += `
    <div class="card">
      <h4>Moyens sélectionnés</h4>
      ${selectedItems.length === 0 ? `<p class="empty">Aucun moyen sélectionné.</p>` : `
        <div class="dispatch-selection-list">
          ${selectedItems.map(item => `
            <div class="dispatch-selected-line">
              <div>
                <strong>${item.vehicle.nom}</strong><br>
                <span class="muted">${item.profil.code} / ${item.profil.sp} SP / ${item.profil.mode} / ${item.caserne.nom}</span>
              </div>
              <button onclick="removeVehicleFromSelection('${intervention.id}', '${item.vehicle.id}')">Retirer</button>
            </div>
          `).join("")}
        </div>
      `}
      <div class="dispatch-actions">
        <button onclick="clearDispatchSelection('${intervention.id}')">Vider la sélection</button>
        <button ${evaluation && evaluation.canEngage ? "" : "disabled"} onclick="engageSelection('${intervention.id}')">
          Engager la sélection
        </button>
      </div>
    </div>
  `;

  if (recommendedVehicles.length > 0) {
    html += `
      <div class="card">
        <h4>Suggestion opérateur</h4>
        <p class="muted">
          Moyens prioritaires pour couvrir le besoin principal ou une option utile :
          <strong>${recommendedVehicles.join(", ")}</strong>
        </p>
      </div>
    `;
  }
  html += `
    <div class="card">
      <h4>Moyens disponibles</h4>
      ${availableVehicles.length === 0 ? `<p class="empty">Aucun moyen mobilisable.</p>` : `
        <div class="dispatch-available-list">
          ${availableVehicles.map(entry => {
            const alreadySelected = selectedItems.some(item => item.vehicle.id === entry.vehicle.id);

            return `
              <div class="dispatch-vehicle-card">
                <div class="dispatch-vehicle-header">
                  <div>
                    <strong>${entry.vehicle.nom}</strong>
                    ${entry.helpsMissing ? `<span class="dispatch-help-badge">Besoin principal</span>` : ""}
                    ${!entry.helpsMissing && entry.helpsOption ? `<span class="dispatch-help-badge">PS utile</span>` : ""}
                    <div class="muted">${entry.caserne?.nom || entry.vehicle.caserneId}</div>
                  </div>
                  <span class="muted">
                    ${Number.isFinite(entry.distanceKm) ? `${entry.distanceKm.toFixed(1)} km` : "-"}
                  </span>
                </div>

                <div class="dispatch-profile-buttons">
                  ${entry.profils
                    .sort((a, b) => {
                      if (a.helpsOption !== b.helpsOption) {
                        return a.helpsOption ? -1 : 1;
                      }

                      if (a.helpsMissing !== b.helpsMissing) {
                        return a.helpsMissing ? -1 : 1;
                      }

                      const aDisplay = a.displayCode || a.profil.code;
                      const bDisplay = b.displayCode || b.profil.code;
                      if (aDisplay !== bDisplay) {
                        return aDisplay.localeCompare(bDisplay, "fr-FR");
                      }

                      const aModeRank = a.profil.mode === "nominal" ? 0 : 1;
                      const bModeRank = b.profil.mode === "nominal" ? 0 : 1;
                      if (aModeRank !== bModeRank) {
                        return aModeRank - bModeRank;
                      }

                      return b.profil.sp - a.profil.sp;
                    })
                    .map(p => `
                      <button
                        class="dispatch-profile-btn dispatch-profile-${p.profil.mode.toLowerCase()}"
                        ${alreadySelected ? "disabled" : ""}
                        onclick="addVehicleToSelection('${intervention.id}', '${entry.vehicle.id}', '${p.profil.code}', '${p.profil.mode}', ${p.profil.sp})"
                      >
                        ${p.helpsMissing ? "✅ " : p.helpsOption ? "⚠ " : ""}${p.displayCode === "PS" ? "Prompt secours" : p.displayCode} • ${p.profil.sp} SP • ${p.profil.mode}
                      </button>
                    `).join("")}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `}
    </div>
  `;

  container.innerHTML = html;
}

function renderMissions() {
  const container = document.getElementById("missionsPanel");

  if (state.activeMissions.length === 0) {
    container.innerHTML = `<p class="empty">Aucune mission en cours.</p>`;
    return;
  }

  const missionsByIntervention = {};

  state.activeMissions.forEach(mission => {
    if (!missionsByIntervention[mission.interventionId]) {
      missionsByIntervention[mission.interventionId] = {
        interventionId: mission.interventionId,
        interventionLabel: mission.interventionLabel,
        zone: mission.zone || "-",
        createdAt: mission.createdAt || 0,
        needsLabel: mission.needsLabel || "-",
        interventionStatus: mission.interventionStatus || "ALERTE",
        mainCoverageComplete: !!mission.mainCoverageComplete,
        missions: []
      };
    }

    missionsByIntervention[mission.interventionId].missions.push(mission);
  });

  const groups = Object.values(missionsByIntervention).sort((a, b) => {
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  container.innerHTML = groups.map(group => {
    const countLabel = group.missions.length === 1
      ? "1 engin engagé"
      : `${group.missions.length} engins engagés`;

    const createdDate = group.createdAt ? new Date(group.createdAt) : null;
    const createdTime = createdDate
      ? `${String(createdDate.getHours()).padStart(2, "0")}:${String(createdDate.getMinutes()).padStart(2, "0")}`
      : "--:--";

    return `
      <div class="mission-card" onclick="openActiveIntervention('${group.interventionId}')" style="cursor:pointer;">
        <div class="mission-card-header">
          <div>
            <div class="mission-title">${group.interventionLabel}</div>
            <div class="mission-subtitle mission-subtitle-meta">
              ${group.zone} • ${createdTime} • ${group.needsLabel}
            </div>
            <div class="mission-subtitle">
              ${getInterventionStatusBadge(group.interventionStatus)}
            </div>
            <div class="mission-subtitle">${countLabel}</div>
            ${!group.mainCoverageComplete ? `
              <div class="mission-subtitle" style="color:#fbbf24;">
                Couverture provisoire en attente de moyens complémentaires
              </div>
            ` : ""}
          </div>
        </div>

        <div class="mission-list">
          ${group.missions.map(mission => `
            <div class="mission-row">
              <div class="mission-row-vehicle">
                <div class="mission-vehicle-name">${mission.vehicleLabel}</div>
                <div class="mission-row-origin">
                  ${mission.caserneLabel} • ${mission.profilCode}${mission.profilMode ? ` (${mission.profilMode})` : ""}
                </div>
                ${mission.phase === "transport_hopital" && mission.hospitalName ? `
                  <div class="mission-row-destination">→ ${mission.hospitalName}</div>
                ` : ""}
              </div>

              <div class="mission-row-phase">
                <span class="mission-phase-badge phase-${mission.phase}">
                  ${getMissionPhaseLabel(mission.phase)}
                </span>
              </div>

              <div class="mission-row-time">${mission.remaining} min</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function getVehicleDisplayState(vehicle) {
  if (vehicle.etat === "sur_place") {
    return "vehicle-busy";
  }

  if (vehicle.etat !== "disponible") {
    return "vehicle-mid";
  }

  const typeConfig = getVehicleTypeConfig(vehicle.type);

  // Vehicule dispo, mais pas encore gere par le moteur metier
  if (!typeConfig || !Array.isArray(typeConfig.profils) || typeConfig.profils.length === 0) {
    return "vehicle-free";
  }

  // Vehicule gere, mais impossible a armer avec les SP dispo
  if (getAvailableProfilesForVehicle(vehicle).length === 0) {
    return "vehicle-unarmable";
  }

  return "vehicle-free";
}

function renderCasernes() {
  const container = document.getElementById("casernesPanel");
  const casernesToRender = state.casernes.filter(caserne => isCaserneOwned(caserne.id));
  const lockedCount = state.casernes.length - casernesToRender.length;

  if (casernesToRender.length === 0) {
    container.innerHTML = `<p class="empty">Aucune caserne debloquee. Ouvre le panneau progression.</p>`;
    return;
  }

  container.innerHTML = `
    ${lockedCount > 0 ? `
      <div class="card">
        <p><strong>${lockedCount}</strong> caserne(s) verrouillee(s). Ouvre le panneau progression pour les debloquer.</p>
      </div>
    ` : ""}
    ${casernesToRender.map(caserne => {
    const spUsed = calculateUsedSP(caserne.id);
    const spPosteAvailable = Math.max(0, caserne.sp_poste - spUsed);
    const spTotalAvailable = Math.max(0, (caserne.sp_poste + caserne.sp_astreinte) - spUsed);
    const influencePopulation = typeof getInfluencePopulationByCaserneId === "function"
      ? getInfluencePopulationByCaserneId(caserne.id)
      : 0;
    const influenceZoneCount = typeof getInfluenceZoneCountByCaserneId === "function"
      ? getInfluenceZoneCountByCaserneId(caserne.id)
      : 0;

    const vehicules = state.vehicules.filter(vehicle =>
      vehicle.caserneId === caserne.id && isVehicleOwned(vehicle.id)
    );

    return `
      <div class="card">
        <h3>${caserne.nom}</h3>
        <p><strong>Niveau :</strong> ${typeof getCaserneLevel === "function" ? getCaserneLevel(caserne.id) : 1}</p>
        <p><strong>SP poste :</strong> ${caserne.sp_poste}</p>
        <p><strong>SP astreinte :</strong> ${caserne.sp_astreinte}</p>
        <p><strong>SP utilises :</strong> ${spUsed}</p>
        <p><strong>SP disponibles poste :</strong> ${spPosteAvailable}</p>
        <p><strong>SP disponibles total :</strong> ${spTotalAvailable}</p>
        <p><strong>Zone d'influence:</strong> ${influenceZoneCount} commune(s)</p>
        <p><strong>Population couverte:</strong> ${Math.floor(influencePopulation).toLocaleString("fr-FR")} hab.</p>

        <div class="vehicle-list">
          ${vehicules.map(vehicle => {
            const statusConfig = getVehicleDisplayStatus(vehicle);

            const isDispo = vehicle.status === "DISPO" && vehicle.etat === "disponible";
            const isUnarmable = isDispo && getAvailableProfilesForVehicle(vehicle).length === 0;

            const extraClass = isUnarmable ? " vehicle-chip--dispo-unarmable" : "";
            const inlineStyle = isUnarmable
              ? ""
              : `background:${statusConfig.color}; color:${statusConfig.textColor || "#111827"};`;

            const title = isUnarmable
              ? `${vehicle.nom} - Disponible mais non armable (effectif insuffisant)`
              : `${vehicle.nom} - ${statusConfig.label}`;

            return `
              <div
                class="vehicle vehicle-line${extraClass}"
                style="${inlineStyle}"
                title="${title}"
              >
                ${vehicle.nom}
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }).join("")}
  `;
}

function getVehicleDisplayStatus(vehicle) {
  if (isVehicleReserved(vehicle.id)) {
    return VEHICLE_STATUS.RESERVE;
  }

  return VEHICLE_STATUS[vehicle.status] || VEHICLE_STATUS.DISPO;
}

function showAdminPanel() {
  if (isProgressionEnabled() && !hasFeatureUnlocked("adminFleet")) {
    alert("Fonction verrouillee. Debloque 'Administration flotte' dans le panneau progression.");
    return;
  }

  state.currentCenterPanel = "admin";
  state.isPaused = true;

  if (!state.currentAdminPanel) {
    state.currentAdminPanel = "vehicules";
  }

  saveState();
  renderAll();
}

function openProgressionPanel() {
  state.currentCenterPanel = "progression";
  state.currentAdminPanel = null;
  state.isPaused = true;
  saveState();
  renderAll();
}

function openAboutPanel() {
  state.currentCenterPanel = "about";
  state.currentAdminPanel = null;
  state.isPaused = true;
  saveState();
  renderAll();
}

function openTerritorySetupPanel() {
  state.currentCenterPanel = "territorySetup";
  state.currentAdminPanel = null;
  state.isPaused = true;
  saveState();
  renderAll();
}

function getStorageKeyForCurrentVersion() {
  const version = APP_META?.version || "v0";
  return `cta-manager-lite-${version}`;
}

function exportCareerBackup() {
  const payload = {
    app: APP_META?.name || "CTA-Manager Lite",
    version: APP_META?.version || "unknown",
    exportedAt: new Date().toISOString(),
    state
  };

  const content = JSON.stringify(payload, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `cta-manager-backup-${(APP_META?.version || "v0").replace(/\./g, "_")}.json`;

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function triggerCareerImport(inputId) {
  const input = document.getElementById(inputId);
  if (!input) {
    return;
  }

  input.value = "";
  input.click();
}

function importCareerBackupFromInput(inputId) {
  const input = document.getElementById(inputId);
  const file = input?.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = event => {
    try {
      const raw = String(event?.target?.result || "");
      const parsed = JSON.parse(raw);
      const importedState = parsed?.state;

      if (!importedState || typeof importedState !== "object" || !importedState.progression) {
        alert("Backup invalide.");
        return;
      }

      const storageKey = getStorageKeyForCurrentVersion();
      localStorage.setItem(storageKey, JSON.stringify(importedState));
      location.reload();
    } catch (error) {
      alert("Impossible de lire le fichier de backup.");
    }
  };

  reader.readAsText(file);
}

function buyVehicleByTypeFromSelect(type, selectId) {
  const select = document.getElementById(selectId);
  if (!select || !select.value) {
    alert("Selectionne une caserne.");
    return;
  }

  buyVehicleByType(type, select.value);
}

function createCustomCaserneFromProgression() {
  const nom = document.getElementById("customCaserneName")?.value || "";
  const lat = document.getElementById("customCaserneLat")?.value || "";
  const lon = document.getElementById("customCaserneLon")?.value || "";
  const spPoste = document.getElementById("customCasernePoste")?.value || 0;
  const spAstreinte = document.getElementById("customCaserneAstreinte")?.value || 0;

  if (typeof createCustomCaserne !== "function") {
    alert("Creation de caserne indisponible.");
    return;
  }

  createCustomCaserne({ nom, lat, lon, spPoste, spAstreinte });
}

function showDetailPanel() {
  state.currentCenterPanel = "detail";
  state.currentAdminPanel = null;
  state.isPaused = false;

  saveState();
  renderAll();
}

async function submitTerritorySelection(
  selectId = "territoryDepartmentSelect",
  caserneSelectId = "territoryStartCaserneSelect"
) {
  const select = document.getElementById(selectId);
  const caserneSelect = document.getElementById(caserneSelectId);
  const code = select?.value;
  const startingCaserneId = caserneSelect?.value;
  if (!code) {
    alert("Choisis un departement.");
    return;
  }

  if (!startingCaserneId) {
    alert("Choisis une caserne de depart.");
    return;
  }

  await applyDepartmentSelection(code, startingCaserneId);
}

function renderCenterPanel() {
  const container = document.getElementById("detailPanel");
  if (!container) return;

  if (state.currentCenterPanel === "territorySetup") {
    const catalog = typeof getTerritoryCatalog === "function" ? getTerritoryCatalog() : [];
    const territoryLabel = typeof getCurrentTerritoryLabel === "function"
      ? getCurrentTerritoryLabel()
      : "Territoire non configure";
    const isFirstLaunch = !!state?.installation?.isFirstLaunch;

    container.innerHTML = `
      <div class="card">
        <div class="panel-header">
          <h3>Configuration territoire</h3>
          <div class="panel-actions">
            <button class="secondary" onclick="reloadTerritoryCatalog().then(() => renderAll())">Rafraichir</button>
          </div>
        </div>

        <p><strong>Etat actuel:</strong> ${territoryLabel}</p>
        <p class="muted">Choisis un departement. Le jeu calculera automatiquement les zones d'influence a partir des communes.</p>

        ${catalog.length === 0 ? `
          <p class="empty">Aucun pack detecte. Verifie le dossier packs/fr.</p>
        ` : `
          <label for="territoryDepartmentSelect"><strong>Departement</strong></label>
          <select id="territoryDepartmentSelect" style="display:block;width:100%;margin-top:6px;margin-bottom:12px;padding:8px;border-radius:8px;">
            ${catalog.map(item => `
              <option value="${item.code}">
                ${item.code} - ${item.label}${typeof item.count === "number" ? ` (${item.count} communes)` : ""}
              </option>
            `).join("")}
          </select>
          <label for="territoryStartCaserneSelect"><strong>Caserne de depart</strong></label>
          <select id="territoryStartCaserneSelect" style="display:block;width:100%;margin-top:6px;margin-bottom:12px;padding:8px;border-radius:8px;">
            ${CASERNES.map(caserne => `
              <option value="${caserne.id}" ${caserne.id === (SETTINGS?.progression?.startingCaserneId || CASERNES[0]?.id) ? "selected" : ""}>
                ${caserne.nom}
              </option>
            `).join("")}
          </select>
          <p class="muted">
            ${isFirstLaunch
              ? "La carriere demarre avec 1 caserne niveau 1 et 1 VIP dans la caserne choisie."
              : "En cours de partie, le changement de departement ne modifie pas ta carriere."}
          </p>
          <div class="panel-actions">
            <button onclick="submitTerritorySelection('territoryDepartmentSelect', 'territoryStartCaserneSelect')">
              ${isFirstLaunch ? "Demarrer la carriere" : "Appliquer ce departement"}
            </button>
          </div>
        `}
      </div>
    `;
    return;
  }

  if (state.currentCenterPanel === "admin") {
    if (isProgressionEnabled() && !hasFeatureUnlocked("adminFleet")) {
      state.currentCenterPanel = "progression";
      state.currentAdminPanel = null;
      saveState();
      renderCenterPanel();
      return;
    }

    let adminContentHtml = `<div class="empty">Choisis un module d'administration.</div>`;

    if (state.currentAdminPanel === "vehicules") {
      adminContentHtml = renderAdminVehiculesHtml();
    } else if (state.currentAdminPanel === "ajoutVehicule") {
      adminContentHtml = renderAdminAjoutVehiculeHtml();
    }

    container.innerHTML = `
      <div class="card">
        <div class="panel-header">
          <h3>Administration</h3>
          <div class="panel-actions">
            <button onclick="showDetailPanel()">Retour</button>
          </div>
        </div>

        <div class="panel-actions" style="margin-bottom:12px;">
          <button onclick="openAdminPanel('vehicules')">Vehicules</button>
          <button onclick="openAdminPanel('ajoutVehicule')">Transferer un vehicule</button>
        </div>

        <div style="
          background:#fff3cd;
          border:1px solid #ffeeba;
          color:#856404;
          padding:8px;
          border-radius:6px;
          margin-bottom:10px;
        ">
        Simulation en pause pendant l'edition
        </div>

        <div id="adminContent">${adminContentHtml}</div>
      </div>
    `;
    return;
  }

  if (state.currentCenterPanel === "about") {
    const mode = state?.installation?.mode || "offline";
    const modeLabel = mode === "online"
      ? "online (API / cloud)"
      : "offline local (localStorage)";
    const territoryLabel = typeof getCurrentTerritoryLabel === "function"
      ? getCurrentTerritoryLabel()
      : "Territoire non configure";

    container.innerHTML = `
      <div class="card">
        <div class="panel-header">
          <h3>A propos</h3>
          <div class="panel-actions">
            <button onclick="showDetailPanel()">Retour</button>
          </div>
        </div>

        <p><strong>Jeu:</strong> ${APP_META?.name || "CTA-Manager Lite"}</p>
        <p><strong>Version:</strong> ${APP_META?.version || "v0"}</p>
        <p><strong>Mode courant:</strong> ${modeLabel}</p>
        <p><strong>Territoire:</strong> ${territoryLabel}</p>
      </div>

      <div class="card">
        <h4>Changelog rapide</h4>
        <ul class="about-list">
          <li>v0.12.8: casernes initiales simplifiees, niveau 1 = 0 poste / 3 astreinte.</li>
          <li>v0.12.7: validation auto des codes metier avant deploiement.</li>
          <li>v0.12.6: influence tres locale (12 km / rayon 5 / facteur mini 0.08).</li>
          <li>v0.12.5: influence encore durcie (16 km / rayon 7 / facteur mini 0.12).</li>
          <li>v0.12.4: influence resserree (22 km / rayon 10 / facteur mini 0.25).</li>
          <li>v0.12.3: zone d'influence affichee avec borne operationnelle (fini les couvertures geantes).</li>
          <li>v0.12.2: reset/nouvelle carriere nettoyes (plus de reliquats de flotte historique).</li>
          <li>v0.12.1: correction cout Orleans Nord + creation de casernes personnalisees.</li>
          <li>v0.12.0: demarrage VIP only + niveau 1 de caserne initialise pour la progression.</li>
          <li>v0.11.1: corrections reengagement retour + actions retirer/modifier.</li>
          <li>v0.11.0: choix departement + packs territoires + zones dynamiques.</li>
          <li>v0.10.1: zones d'influence des casernes basees sur population + distance.</li>
          <li>v0.10.0: panneau A propos, badge de mode visible, checklist release.</li>
          <li>v0.9.4: correction globale des textes UTF-8.</li>
        </ul>
      </div>

      <div class="card">
        <h4>Checklist release</h4>
        <ol class="about-list">
          <li>Version + changelog a jour.</li>
          <li>Smoke tests gameplay (generation, engagement, fin mission).</li>
          <li>Tests progression (achats, debloquages, administration flotte).</li>
          <li>Test sauvegarde export/import JSON.</li>
          <li>Push main + verification du deploiement GitHub Pages.</li>
        </ol>
      </div>
    `;
    return;
  }

  if (state.currentCenterPanel === "progression") {
    const progression = state.progression || {};
    const lockedCasernes = state.casernes.filter(caserne => !isCaserneOwned(caserne.id));
    const lockedVehicleTypes = getLockedVehicleTypes();
    const unlockedVehicleTypes = getUnlockedVehicleTypes();
    const ownedCasernes = state.casernes.filter(caserne => isCaserneOwned(caserne.id));
    const ownedVehicles = state.vehicules.filter(vehicle => isVehicleOwned(vehicle.id));
    const avgQuality = progression.qualityRunCount > 0
      ? Math.round(progression.qualityTotalScore / progression.qualityRunCount)
      : null;

    const lockedFeatures = [
      {
        key: "hospitalTransport",
        label: "Transport hopital",
        description: "Active les interventions avec transport vers hopital."
      },
      {
        key: "adminFleet",
        label: "Administration flotte",
        description: "Permet l'ajout et la suppression manuelle de vehicules."
      }
    ].filter(feature => !hasFeatureUnlocked(feature.key));

    container.innerHTML = `
      <div class="card">
        <div class="panel-header">
          <h3>Progression</h3>
          <div class="panel-actions">
            <button onclick="showDetailPanel()">Retour</button>
          </div>
        </div>

        <p><strong>Budget:</strong> ${Math.floor(progression.money || 0).toLocaleString("fr-FR")} \u20AC</p>
        <p><strong>Interventions Terminées:</strong> ${progression.completedInterventions || 0}</p>
        ${progression.lastReward ? `<p class="muted">Derniere recette: +${Math.floor(progression.lastReward.amount).toLocaleString("fr-FR")} \u20AC (${progression.lastReward.reason}${typeof progression.lastReward.qualityScore === "number" ? `, qualite ${progression.lastReward.qualityScore}/100` : ""})</p>` : ""}
        ${progression.lastReward?.qualityBreakdown ? `
          <p class="muted">
            Detail qualite: couverture ${progression.lastReward.qualityBreakdown.coverageDelta >= 0 ? "+" : ""}${progression.lastReward.qualityBreakdown.coverageDelta},
            delai ${progression.lastReward.qualityBreakdown.dispatchDelta >= 0 ? "+" : ""}${progression.lastReward.qualityBreakdown.dispatchDelta},
            sur-engagement -${progression.lastReward.qualityBreakdown.overEngagementPenaltyPoints}
          </p>
        ` : ""}
      </div>

      <div class="card">
        <h4>Resume carriere</h4>
        <p><strong>Casernes ouvertes:</strong> ${ownedCasernes.length}</p>
        <p><strong>Vehicules en flotte:</strong> ${ownedVehicles.length}</p>
        <p><strong>Types debloques:</strong> ${unlockedVehicleTypes.length}</p>
        <p><strong>Qualite moyenne dispatch:</strong> ${avgQuality !== null ? `${avgQuality}/100` : "-"}</p>
        <p><strong>Meilleur score qualite:</strong> ${typeof progression.bestQualityScore === "number" ? `${progression.bestQualityScore}/100` : "-"}</p>
        <p><strong>Pire score qualite:</strong> ${typeof progression.worstQualityScore === "number" ? `${progression.worstQualityScore}/100` : "-"}</p>
        <p><strong>Bonus qualite cumules:</strong> +${Math.floor(progression.totalQualityBonus || 0).toLocaleString("fr-FR")} \u20AC</p>
        <p><strong>Malus qualite cumules:</strong> -${Math.floor(progression.totalQualityPenalty || 0).toLocaleString("fr-FR")} \u20AC</p>
      </div>

      <div class="card">
        <h4>Sauvegarde carriere</h4>
        <p class="muted">Exporte ou restaure ta progression locale au format JSON.</p>
        <input type="file" id="careerBackupInput" accept=".json,application/json" style="display:none;" onchange="importCareerBackupFromInput('careerBackupInput')">
        <div class="panel-actions">
          <button onclick="exportCareerBackup()">Exporter backup JSON</button>
          <button class="secondary" onclick="triggerCareerImport('careerBackupInput')">Importer backup JSON</button>
        </div>
      </div>

      <div class="card">
        <h4>Historique recettes (10)</h4>
        ${Array.isArray(progression.rewardHistory) && progression.rewardHistory.length > 0 ? `
          <div class="progression-grid">
            ${progression.rewardHistory.slice(0, 10).map(item => {
              const simMin = typeof item.simulationMinutes === "number" ? item.simulationMinutes : null;
              const timeLabel = simMin !== null ? `${getSimulationDayLabel(simMin)} ${formatTime(simMin)}` : "-";

              return `
                <div class="progression-item">
                  <div><strong>${item.interventionLabel || "Intervention"}</strong></div>
                  <div class="muted">${timeLabel}</div>
                  <div class="muted">+${Math.floor(item.amount || 0).toLocaleString("fr-FR")} \u20AC</div>
                  <div class="muted">
                    ${typeof item.qualityScore === "number" ? `Qualite ${item.qualityScore}/100` : "Qualite -"}
                    ${typeof item.qualityMoneyDelta === "number" ? ` (${item.qualityMoneyDelta >= 0 ? "+" : ""}${item.qualityMoneyDelta} \u20AC)` : ""}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        ` : `<p class="empty">Aucune recette enregistree.</p>`}
      </div>

      <div class="card">
        <h4>Debloquer une caserne</h4>
        ${lockedCasernes.length === 0 ? "<p class='empty'>Toutes les casernes sont ouvertes.</p>" : `
          <div class="progression-grid">
            ${lockedCasernes.map(caserne => {
              const cost = getCaserneUnlockCost(caserne.id);
              const canBuy = (progression.money || 0) >= cost;

              return `
                <div class="progression-item">
                  <div><strong>${caserne.nom}</strong></div>
                  <div class="muted">${cost.toLocaleString("fr-FR")} \u20AC</div>
                  <button ${canBuy ? "" : "disabled"} onclick="unlockCaserne('${caserne.id}')">Acheter</button>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>

      <div class="card">
        <h4>Creer une caserne personnalisee</h4>
        <p class="muted">Ajoute une caserne ou tu veux (coordonnees GPS). Elle sera ouverte directement au niveau 1 (0 poste / 3 astreinte par defaut).</p>
        <p class="muted">Cout creation: ${Math.floor(getCustomCaserneCost ? getCustomCaserneCost() : 0).toLocaleString("fr-FR")} \u20AC</p>
        <div style="display:grid; gap:8px; max-width:520px;">
          <label>
            Nom
            <input id="customCaserneName" type="text" placeholder="ex: CIS Fleury" />
          </label>
          <label>
            Latitude
            <input id="customCaserneLat" type="text" placeholder="ex: 47.93" />
          </label>
          <label>
            Longitude
            <input id="customCaserneLon" type="text" placeholder="ex: 1.88" />
          </label>
          <label>
            SP poste
            <input id="customCasernePoste" type="number" min="0" step="1" value="0" />
          </label>
          <label>
            SP astreinte
            <input id="customCaserneAstreinte" type="number" min="0" step="1" value="3" />
          </label>
          <div class="panel-actions">
            <button onclick="createCustomCaserneFromProgression()">Creer et ouvrir</button>
          </div>
        </div>
      </div>

      <div class="card">
        <h4>Debloquer des types de vehicules</h4>
        ${lockedVehicleTypes.length === 0 ? "<p class='empty'>Tous les types sont debloques.</p>" : `
          <div class="progression-grid">
            ${lockedVehicleTypes.map(type => {
              const cost = getVehicleTypeUnlockCost(type);
              const canBuy = (progression.money || 0) >= cost;

              return `
                <div class="progression-item">
                  <div><strong>${type}</strong></div>
                  <div class="muted">${cost.toLocaleString("fr-FR")} \u20AC</div>
                  <button ${canBuy ? "" : "disabled"} onclick="unlockVehicleType('${type}')">Debloquer</button>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>

      <div class="card">
        <h4>Acheter une unite</h4>
        ${unlockedVehicleTypes.length === 0 ? "<p class='empty'>Debloque d'abord un type de vehicule.</p>" : `
          <div class="progression-grid">
            ${unlockedVehicleTypes.map(type => {
              const cost = getVehicleUnitCostByType(type);
              const canBuy = (progression.money || 0) >= cost && ownedCasernes.length > 0;
              const selectId = `buyTypeCaserne_${type}`;

              return `
                <div class="progression-item">
                  <div><strong>${type}</strong></div>
                  <div class="muted">Cout unite: ${cost.toLocaleString("fr-FR")} \u20AC</div>
                  <select id="${selectId}">
                    ${ownedCasernes.map(caserne => `
                      <option value="${caserne.id}">${caserne.nom}</option>
                    `).join("")}
                  </select>
                  <button ${canBuy ? "" : "disabled"} onclick="buyVehicleByTypeFromSelect('${type}', '${selectId}')">Acheter et affecter</button>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>

      <div class="card">
        <h4>Fonctionnalites</h4>
        ${lockedFeatures.length === 0 ? "<p class='empty'>Toutes les fonctionnalites sont debloquees.</p>" : `
          <div class="progression-grid">
            ${lockedFeatures.map(feature => {
              const cost = getFeatureUnlockCost(feature.key);
              const canBuy = (progression.money || 0) >= cost;

              return `
                <div class="progression-item">
                  <div><strong>${feature.label}</strong></div>
                  <div class="muted">${feature.description}</div>
                  <div class="muted">${cost.toLocaleString("fr-FR")} \u20AC</div>
                  <button ${canBuy ? "" : "disabled"} onclick="unlockFeature('${feature.key}')">Debloquer</button>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>
    `;
    return;
  }

  renderDetail();
}
function renderAdminAjoutVehiculeHtml() {
  const transferableVehicles = state.vehicules.filter(vehicle => canVehicleBeTransferred(vehicle));
  const ownedCasernes = state.casernes.filter(caserne => isCaserneOwned(caserne.id));

  return `
    <div class="card">
      <h3>Transferer un vehicule</h3>

      <div style="display:grid; gap:10px;">
        <label>
          Vehicule<br>
          <select id="transferVehicleId">
            ${transferableVehicles.map(vehicle => {
              const caserne = getCaserneById(vehicle.caserneId);
              return `<option value="${vehicle.id}">${vehicle.nom} (${vehicle.type}) - ${caserne ? caserne.nom : vehicle.caserneId}</option>`;
            }).join("")}
          </select>
          ${transferableVehicles.length === 0 ? `<div class="muted">Aucun élément.</div>` : ""}
        </label>

        <label>
          Caserne cible<br>
          <select id="transferVehicleCaserneId">
            ${ownedCasernes.map(caserne => `
              <option value="${caserne.id}">${caserne.nom}</option>
            `).join("")}
          </select>
        </label>

        <div class="panel-actions">
          <button ${transferableVehicles.length === 0 ? "disabled" : ""} onclick="saveNewVehicule()">Lancer transfert</button>
          <button onclick="openAdminPanel('vehicules')">Annuler</button>
        </div>
      </div>
    </div>
  `;
}

function saveNewVehicule() {
  if (isProgressionEnabled() && !hasFeatureUnlocked("adminFleet")) {
    alert("Fonction verrouillee. Debloque 'Administration flotte' dans le panneau progression.");
    return;
  }

  const vehicleId = document.getElementById("transferVehicleId")?.value;
  const caserneId = document.getElementById("transferVehicleCaserneId")?.value;

  if (!vehicleId || !caserneId) {
    alert("Merci de selectionner un vehicule et une caserne cible.");
    return;
  }

  startVehicleTransfer(vehicleId, caserneId);
  openAdminPanel("vehicules");
}

function openAdminPanel(panelName) {
  state.currentCenterPanel = "admin";
  state.currentAdminPanel = panelName;
  saveState();
  renderCenterPanel();
}

function renderAdminVehiculesHtml() {
  const ownedVehicles = state.vehicules.filter(vehicle => isVehicleOwned(vehicle.id));
  return `
    <div class="card">
      <h3>Liste des vehicules</h3>
      <p>Total : ${ownedVehicles.length}</p>

      <div style="display:grid; gap:8px;">
        ${ownedVehicles.map(v => {
          const caserne = state.casernes.find(c => c.id === v.caserneId);
          const targetCaserne = v.transitTargetCaserneId
            ? state.casernes.find(c => c.id === v.transitTargetCaserneId)
            : null;
          const transitLine = v.etat === "transit_caserne"
            ? `<div class="muted">Transit vers ${targetCaserne ? targetCaserne.nom : v.transitTargetCaserneId} (${v.transitRemaining || 0} min)</div>`
            : "";

          return `
            <div class="vehicle" style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
              <div>
                <strong>${v.nom}</strong> - ${v.type} - ${caserne ? caserne.nom : v.caserneId}
                ${transitLine}
              </div>

              <div class="panel-actions">
                <button class="secondary" onclick="deleteVehicule('${v.id}')">Supprimer</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function deleteVehicule(vehicleId) {
  if (isProgressionEnabled() && !hasFeatureUnlocked("adminFleet")) {
    alert("Fonction verrouillee. Debloque 'Administration flotte' dans le panneau progression.");
    return;
  }

  const vehicle = state.vehicules.find(v => v.id === vehicleId);

  if (!vehicle) {
    alert("Vehicule introuvable.");
    return;
  }

  const isEngaged = state.activeMissions.some(mission => mission.vehicleId === vehicleId);
  if (isEngaged) {
    alert("Impossible de supprimer un vehicule actuellement engage sur une mission.");
    return;
  }

  if (vehicle.etat === "transit_caserne") {
    alert("Impossible de supprimer un vehicule pendant son transit inter-caserne.");
    return;
  }

  const isSelected = Object.values(state.dispatchSelections || {}).some(selection =>
    Array.isArray(selection) && selection.some(item => item.vehicleId === vehicleId)
  );

  if (isSelected) {
    alert("Impossible de supprimer un vehicule actuellement selectionne pour une intervention.");
    return;
  }

  const confirmed = confirm(`Supprimer le vehicule ${vehicle.nom} ?`);
  if (!confirmed) {
    return;
  }

  state.vehicules = state.vehicules.filter(v => v.id !== vehicleId);
  if (state.progression && Array.isArray(state.progression.ownedVehicleIds)) {
    state.progression.ownedVehicleIds = state.progression.ownedVehicleIds.filter(id => id !== vehicleId);
  }

  saveData(STORAGE_KEYS.VEHICULES, state.vehicules);
  saveState();
  renderAll();
}

function renderAll() {
  renderTopbar();
  renderInterventions();
  renderCenterPanel();
  renderMissions();
  renderCasernes();
  normalizeUiText();
}

