const SETTINGS = {
  installation: {
    // Choix applique uniquement au premier lancement.
    // Valeurs supportees: "offline" | "online"
    defaultMode: "offline",
    // Code departement FR par defaut (null => choix au premier lancement)
    defaultDepartmentCode: null
  },

  simulation: {
    tickMs: 3000
    /*
    1000	1 minute par seconde
    500	2 minutes par seconde
    2000	1 minute toutes les 2 secondes
    */
  },

  departDelay: {
    poste: 5,
    astreinte: 10
  },

  travel: {
    averageSpeedKmH: 40,
    roadFactor: 1.45,
    /**
     * Facteur de correction entre :

      distance à vol d’oiseau

      distance réelle par la route.

      La distance GPS directe est toujours plus courte que la route.

      Exemple :

      distance carte : 5 km
      distance route : 6.7 km

      Donc on multiplie :

      distance réelle ≈ distance GPS × roadFactor

      Valeur par défaut : 1.35

      C’est une valeur réaliste pour un réseau routier urbain.
     */
    minTimeMinutes: 3
  },

  routing: {
    /*
    "distance": formule locale actuelle (distance + facteur route)
    "matrix": lit d'abord TRAVEL_MATRIX, fallback sur "distance"
    "hybrid": alias de "matrix" pour preparer une future API
    */
    provider: "hybrid",
    matrixEnabled: true,
    jitterMinutes: 0
  },

  zoneInfluence: {
    // Rayon de reference pour la zone d'influence autour des casernes.
    radiusKm: 5,
    // Plancher d'influence pour eviter qu'une commune tombe a 0.
    minFactor: 0.08,
    // Distance max (km) de generation d'une intervention autour des casernes ouvertes.
    maxOperationalDistanceKm: 12
  },

  staffing: {
    updateIntervalHours: 4,
    /* délais a partir duquel les effectifs dans les casernes sont calculés */
    maxVariationPerUpdate: 3
    /* maximum de variation d'effectif ex : 2 = + ou - 2 de variation par rapport a l'effectif précédent */
  },
  REENGAGEMENT_RETOUR: {
  enabled: true,
  travelFactor: 0.5,
  minDelay: 0
},

  progression: {
    enabled: true,
    startingMoney: 15000,
    startingCaserneId: "LCSM",
    startingVehicleIds: ["VIP01"],
    startingUnlockedVehicleTypes: ["VIP"],
    caserneLevel1Staffing: {
      poste: 0,
      astreinte: 3
    },

    rewards: {
      base: 450,
      perNeedUnit: 220,
      completeBonus: 180,
      partialBonus: 40,
      fastDispatchThresholdMinutes: 8,
      fastDispatchBonus: 120,
      slowDispatchThresholdMinutes: 20,
      slowDispatchPenalty: 120,
      minReward: 120
    },

    quality: {
      baseScore: 50,
      completeCoverageBonus: 20,
      partialCoveragePenalty: 15,
      fastDispatchThresholdMinutes: 8,
      fastDispatchBonus: 15,
      slowDispatchThresholdMinutes: 20,
      slowDispatchPenalty: 15,
      overEngagementPenaltyPerVehicle: 8,
      moneyPerPointFromBase: 12
    },

    unlockCosts: {
      features: {
        hospitalTransport: 12000,
        adminFleet: 8000
      },
      vehicleTypeUnlock: {
        VSAV: 6000,
        VTU: 5000,
        FPT: 12000,
        FPTL6: 11000,
        FPTSR: 15000,
        FPTL: 9000,
        CCRM: 9000,
        VSR: 8500,
        EPC: 18000,
        VIP: 7000,
        VLC: 4000,
        VCG: 4500,
        VBS: 4500,
        VLSM: 10000
      },
      casernes: {
        ORL_NOR: 20000,
        ORL_CEN: 20000,
        CHECY: 17000,
        ORMSARAN: 17000,
        INGRE: 13000,
        LCSM: 13000,
        SDIS: 25000
      },
      customCaserne: 22000,
      vehicleByType: {
        VSAV: 9000,
        VTU: 7500,
        FPT: 18000,
        FPTL6: 17000,
        FPTSR: 22000,
        FPTL: 14500,
        CCRM: 14000,
        VSR: 12500,
        EPC: 24000,
        VIP: 10000,
        VLC: 6500,
        VCG: 7000,
        VBS: 7000,
        VLSM: 15500
      }
    }
  }
};
 const APP_META = {
  name: "CTA-Manager Lite",
  version: "v0.13.2"
};
window.APP_META = APP_META;
