/* 
Syntaxe pour les zones : 
"ALL"
["SARAN", "CHECY", "ORLEANS", "INGRE", "SJR", "CHANTEAU"] 
*/


/* SUAP */
const INTERVENTION_TEMPLATES = [
  {
    type: "Malaise à domicile",
    dureeSurPlace: 30,
    poids: 30,
    besoins: [{ code: "SUAP", quantite: 1 }],
    options: [{ code: "PS", quantite: 1, label: "Prompt secours" }],
    zones: "ALL",
    transportHopital: {
    possible: true,
    probabilite: 0.5
    }
  },
  {
    type: "Blessé à domicile",
    dureeSurPlace: 30,
    poids: 30,
    besoins: [{ code: "SUAP", quantite: 1 }],
    options: [{ code: "PS", quantite: 1, label: "Prompt secours" }],
    zones: "ALL",
    transportHopital: {
    possible: true,
    probabilite: 0.75
    }
  },
  {
    type: "Blessé à domicile avec trauma et impotence",
    dureeSurPlace: 30,
    poids: 30,
    besoins: [{ code: "SUAP", quantite: 1 }],
    options: [{ code: "PS", quantite: 1, label: "Prompt secours" }],
    zones: "ALL",
    transportHopital: {
    possible: true,
    probabilite: 0.75
    }
  },
  {
    type: "Malaise LP/VP",
    dureeSurPlace: 30,
    poids: 30,
    besoins: [{ code: "SUAP", quantite: 1 }],
    options: [{ code: "PS", quantite: 1, label: "Prompt secours" }],
    zones: "ALL",
    transportHopital: {
    possible: true,
    probabilite: 0.5
    }
  },
  {
    type: "Blessé au sport",
    dureeSurPlace: 30,
    poids: 20,
    besoins: [{ code: "SUAP", quantite: 1 }],
    options: [{ code: "PS", quantite: 1, label: "Prompt secours" }],
    zones: "ALL",
    transportHopital: {
    possible: true,
    probabilite: 0.5
    }
  },
  {
    type: "Relevage de personne",
    dureeSurPlace: 30,
    poids: 20,
    besoins: [{ code: "SUAP", quantite: 1 }],
    options: [{ code: "PS", quantite: 1, label: "Prompt secours" }],
    zones: "ALL",
    transportHopital: {
    possible: true,
    probabilite: 0.1
    }
  },
  {
    type: "Malaise Urgence Vitale",
    dureeSurPlace: 60,
    poids: 10,
    besoins: [
      { code: "SUAP", quantite: 1 },
      { code: "ISP", quantite: 1 }
    ],
    options: [{ code: "PS", quantite: 1, label: "Prompt secours" }],
    zones: "ALL",
    transportHopital: {
    possible: true,
    probabilite: 0.8
    }
  },
  {
    type: "Detresse Ventilatoire",
    dureeSurPlace: 60,
    poids: 10,
    besoins: [
      { code: "SUAP", quantite: 1 },
      { code: "ISP", quantite: 1 }
    ],
    options: [{ code: "PS", quantite: 1, label: "Prompt secours" }],
    zones: "ALL",
    transportHopital: {
    possible: true,
    probabilite: 0.8
    }
  },
  {
    type: "PNRPAA < R+3",
    dureeSurPlace: 45,
    poids: 10,
    besoins: [
      { code: "INC4", quantite: 1 },
      { code: "SUAP", quantite: 1 }
    ],
    options: [{ code: "PS", quantite: 1, label: "Prompt secours" }],
    zones: "ALL",
    transportHopital: {
    possible: true,
    probabilite: 0.3
    }
  },

  /*Secours Routier*/
  {
    type: "AVP VL SEULE",
    dureeSurPlace: 45,
    poids: 10,
    besoins: [
      { code: "SUAP", quantite: 1 },
      { code: "BAL", quantite: 1 }
    ],
    options: [{ code: "PS", quantite: 1, label: "Prompt secours" }],
    zones: "ALL",
    transportHopital: {
    possible: true,
    probabilite: 0.6,
    }
  },
  {
    type: "ACCIDENT 2 ROUES SEUL",
    dureeSurPlace: 45,
    poids: 5,
    besoins: [
      { code: "SUAP", quantite: 1 },
      { code: "BAL", quantite: 1 },
      { code: "CDG", quantite: 1 }
    ],
    options: [{ code: "PS", quantite: 1, label: "Prompt secours" }],
    zones: "ALL",
    transportHopital: {
    possible: true,
    probabilite: 0.8,
    }
  },
  {
    type: "ACCIDENT VL CONTRE VL DESINCARCERATION",
    dureeSurPlace: 60,
    poids: 5,
    besoins: [
      { code: "SUAP", quantite: 2 },
      { code: "ISP", quantite: 1 },
      { code: "SR", quantite: 1 },
      { code: "BAL", quantite: 1 },
      { code: "CDG", quantite: 1 }
    ],
    options: [{ code: "PS", quantite: 1, label: "Prompt secours" }],
    zones: "ALL",
    transportHopital: {
    possible: true,
    probabilite: 0.8,
    }
  },


  /*INCENDIE*/
  {
    type: "Feu de véhicule",
    dureeSurPlace: 45,
    poids: 10,
    besoins: [{ code: "INC6", quantite: 1 }],
    zones: "ALL"
  },
  {
    type: "Feu de poubelle",
    dureeSurPlace: 20,
    poids: 10,
    besoins: [{ code: "INC4", quantite: 1 }],
    zones: "ALL"
  },
  {
    type: "Feu de pavillon",
    dureeSurPlace: 120,
    poids: 5,
    besoins: [
      { code: "INC6", quantite: 1 },
      { code: "INC4", quantite: 1 },
      { code: "EPC", quantite: 1 },
      { code: "CDG", quantite: 1 }
    ],
    zones: "ALL"
  },
  {
    type: "Feu d'appartement",
    dureeSurPlace: 120,
    poids: 5,
    besoins: [
      { code: "INC6", quantite: 1 },
      { code: "INC4", quantite: 1 },
      { code: "EPC", quantite: 1 },
      { code: "CDG", quantite: 1 },
      { code: "SUAP", quantite: 1 },
      { code: "ISP", quantite: 1 }
    ],
    zones: "ALL"
  },
  {
    type: "Autres Feu Electrique",
    dureeSurPlace: 30,
    poids: 5,
    besoins: [{ code: "INC4", quantite: 1 }],/* CAM quand ça sera possible */
    zones: "ALL"
  },
  {
    type: "Fumée Suspecte dans entreprise",
    dureeSurPlace: 30,
    poids: 5,
    besoins: [
      { code: "INC4", quantite: 1 },
      { code: "CDG", quantite: 1 }
    ],/* CAM quand ça sera possible */
    zones: "ALL"
  },


  /*Operations DIverse*/
  {
    type: "Innondation",
    dureeSurPlace: 60,
    poids: 10,
    besoins: [{ code: "DIV3", quantite: 1 }],
    zones: "ALL"
  },
  {
    type: "Degagement de personne dans un ascenseur",
    dureeSurPlace: 30,
    poids: 5,
    besoins: [{ code: "INC4", quantite: 1 }],
    zones: "ALL"
  },
  

];