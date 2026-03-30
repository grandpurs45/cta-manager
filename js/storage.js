const STORAGE_KEYS = {
  VEHICULES: "cta_vehicules",
  CASERNES: "cta_casernes",
  INTERVENTIONS: "cta_interventions",
  SETTINGS: "cta_settings"
};

function loadData(key, fallback) {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : fallback;
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}