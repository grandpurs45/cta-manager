const ECONOMY = {
  progression: {
    startingMoney: 15000,
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
      postedGuard: {
        minLevel: 3,
        defaultCost: 9000,
        casernes: {}
      },
      staffingUnits: {
        poste: 2400,
        astreinte: 1200
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
    },
    caserneLevels: {
      1: {
        poste: 2,
        astreinte: 5,
        bayCapacity: 1,
        postedGuardUnlocked: false
      },
      2: {
        poste: 4,
        astreinte: 7,
        bayCapacity: 2,
        postedGuardUnlocked: false,
        upgradeCost: 8000
      },
      3: {
        poste: 6,
        astreinte: 9,
        bayCapacity: 3,
        postedGuardUnlocked: false,
        upgradeCost: 15000
      },
      4: {
        poste: 8,
        astreinte: 11,
        bayCapacity: 4,
        postedGuardUnlocked: false,
        upgradeCost: 26000
      },
      5: {
        poste: 10,
        astreinte: 13,
        bayCapacity: 5,
        postedGuardUnlocked: false,
        upgradeCost: 42000
      }
    }
  }
};

window.ECONOMY = ECONOMY;
