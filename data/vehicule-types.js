const VEHICULE_TYPES = {
  FPT: {
    label: "Fourgon Pompe Tonne",
    profils: [
      { code: "INC6", sp: 6, mode: "nominal" },
      { code: "INC4", sp: 4, mode: "nominal" },
      { code: "INC6_DEGRADE", sp: 5, mode: "degrade" },
      { code: "INC4_DEGRADE", sp: 3, mode: "degrade" }
    ]
  },

  FPTSR: {
    label: "Fourgon Pompe Tonne Secours Routier",
    profils: [
      { code: "INC6", sp: 6, mode: "nominal" },
      { code: "INC4", sp: 4, mode: "nominal" },
      { code: "INC6_DEGRADE", sp: 5, mode: "degrade" },
      { code: "INC4_DEGRADE", sp: 3, mode: "degrade" },
      { code: "BAL", sp: 3, mode: "nominal" },
      { code: "SR", sp: 3, mode: "nominal" }
    ]
  },

  FPTL6: {
    label: "Fourgon Pompe Tonne Léger 6",
    profils: [
      { code: "INC6", sp: 6, mode: "nominal" },
      { code: "INC4", sp: 4, mode: "nominal" },
      { code: "INC6_DEGRADE", sp: 5, mode: "degrade" },
      { code: "INC4_DEGRADE", sp: 3, mode: "degrade" }
    ]
  },
    CCRM: {
    label: "Camion Citerne Rural Moyen",
    profils: [
      { code: "INC6", sp: 6, mode: "nominal" },
      { code: "INC4", sp: 4, mode: "nominal" },
      { code: "INC6_DEGRADE", sp: 5, mode: "degrade" },
      { code: "INC4_DEGRADE", sp: 3, mode: "degrade" },
      { code: "FDF", sp: 4, mode: "nominal" },
      { code: "FDF_DEGRADE", sp: 3, mode: "degrade" }
    ]
  },
  EPC: {
    label: "Echelle Pivotante Combiné",
    profils: [
      { code: "EPC", sp: 2, mode: "nominal" }
    ]
  },
  FPTL: {
    label: "Fourgon Pompe Tonne Léger",
    profils: [
      { code: "INC4", sp: 4, mode: "nominal" },
      { code: "INC4_DEGRADE", sp: 3, mode: "degrade" }
    ]
  },

  VSAV: {
    label: "Véhicule de secours et d'assistance aux victimes",
    profils: [
      { code: "SUAP", sp: 3, mode: "nominal" },
      { code: "SUAP_DEGRADE", sp: 2, mode: "degrade" }
    ]
  },

  VTU: {
    label: "Véhicule tout usage",
    profils: [
      { code: "DIV2", sp: 2, mode: "nominal" },
      { code: "DIV3", sp: 3, mode: "nominal" },
      { code: "PS", sp: 3, mode: "nominal" }
    ]
  },
  VLC: {
    label: "Véhicule léger de commandement",
    profils: [
      { code: "RENFORT1", sp: 1, mode: "nominal" },
      { code: "RENFORT2", sp: 2, mode: "nominal" },
      { code: "RENFORT3", sp: 3, mode: "nominal" },
      { code: "PS", sp: 3, mode: "nominal" }
    ]
  },
  VIP: {
    label: "Véhicule Intervention Polyvalent",
    profils: [
      { code: "INC4_DEGRADE", sp: 3, mode: "degrade" },
      { code: "DIV3", sp: 3, mode: "nominal" },
      { code: "DIV2", sp: 2, mode: "nominal" },
      { code: "PS", sp: 3, mode: "nominal" }
    ]
  },
  VLSM: {
    label: "Véhicule Léger de Secours Médicalisé",
    profils: [
      { code: "ISP", sp: 1, mode: "nominal" }
    ]
  },
  VBS: {
    label: "Véhicule de Balisage et de Signalisation",
    profils: [
      { code: "BAL", sp: 3, mode: "nominal" }
    ]
  },
  VCG: {
    label: "Véhicule Chef de Groupe",
    profils: [
      { code: "CDG", sp: 1, mode: "nominal" }
    ]
  },
  VSR: {
    label: "Véhicule Secours Routier",
    profils: [
      { code: "BAL", sp: 3, mode: "nominal" },
      { code: "SR", sp: 3, mode: "nominal" }
    ]
  }
};