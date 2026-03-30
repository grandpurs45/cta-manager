const TRAVEL_MATRIX = {
  // Key format helpers:
  // caserneToZone: "<CASERNE_ID>|<ZONE_ID>"
  // zoneToHospital: "<ZONE_ID>|<HOSPITAL_ID>"
  // hospitalToCaserne: "<HOSPITAL_ID>|<CASERNE_ID>"
  caserneToZone: {},
  zoneToHospital: {},
  hospitalToCaserne: {}
};

window.TRAVEL_MATRIX = TRAVEL_MATRIX;
