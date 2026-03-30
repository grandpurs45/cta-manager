const COVERAGE_RULES = {
  INC6: [
    {
      label: "1 INC6",
      requires: [
        { code: "INC6", quantite: 1 }
      ]
    },
    {
      label: "2 INC4",
      requires: [
        { code: "INC4", quantite: 2 }
      ]
    },
    {
      label: "1 INC6 dégradé + 1 RENFORT2",
      requires: [
        { code: "INC6_DEGRADE", quantite: 1 },
        { code: "RENFORT2", quantite: 1 }
      ]
    },
    {
      label: "1 INC4 + 1 RENFORT2",
      requires: [
        { code: "INC4", quantite: 1 },
        { code: "RENFORT2", quantite: 1 }
      ]
    },
    {
      label: "1 INC4 dégradé + 1 INC4",
      requires: [
        { code: "INC4_DEGRADE", quantite: 1 },
        { code: "INC4", quantite: 1 }
      ]
    }
  ],

  INC4: [
    {
      label: "1 INC4",
      requires: [
        { code: "INC4", quantite: 1 }
      ]
    },
    {
      label: "1 INC4 dégradé + 1 INC4",
      requires: [
        { code: "INC4_DEGRADE", quantite: 1 },
        { code: "INC4", quantite: 1 }
      ]
    },
    {
      label: "1 INC4 dégradé + 1 RENFORT2",
      requires: [
        { code: "INC4_DEGRADE", quantite: 1 },
        { code: "RENFORT2", quantite: 1 }
      ]
    }
  ],

  SUAP: [
    {
      label: "1 SUAP",
      requires: [
        { code: "SUAP", quantite: 1 }
      ]
    },
    {
      label: "1 SUAP_DEGRADE + 1 RENFORT2",
      requires: [
        { code: "SUAP_DEGRADE", quantite: 1 },
        { code: "RENFORT2", quantite: 1 }
      ]
    },
  ],

  EPC: [
    {
      label: "1 EPC",
      requires: [
        { code: "EPC", quantite: 1 }
      ]
    },
  ],

  ISP: [
    {
      label: "1 ISP",
      requires: [
        { code: "ISP", quantite: 1 }
      ]
    },
  ],

  DIV3: [
    {
      label: "1 DIV3",
      requires: [
        { code: "DIV3", quantite: 1 }
      ]
    }
  ],

  FDF: [
    {
      label: "1 FDF",
      requires: [
        { code: "FDF", quantite: 1 }
      ]
    }
  ],
  BAL: [
    {
      label: "1 BAL",
      requires: [
        { code: "BAL", quantite: 1 }
      ]
    }
  ],
  CDG: [
    {
      label: "1 CDG",
      requires: [
        { code: "CDG", quantite: 1 }
      ]
    }
  ],
  SR: [
    {
      label: "1 SR",
      requires: [
        { code: "SR", quantite: 1 }
      ]
    }
  ]
};

window.COVERAGE_RULES = COVERAGE_RULES;