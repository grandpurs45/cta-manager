#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadGlobalFromScript(filePath, globalName) {
  const source = fs.readFileSync(filePath, "utf8");
  const probe = `\n;this.__loaded = (typeof ${globalName} !== \"undefined\") ? ${globalName} : ((typeof window !== \"undefined\" && typeof window.${globalName} !== \"undefined\") ? window.${globalName} : undefined);`;
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source + probe, context, { filename: filePath });

  if (typeof context.__loaded !== "undefined") {
    return context.__loaded;
  }

  throw new Error(`Global \"${globalName}\" introuvable dans ${filePath}`);
}

function normalizeCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/_DEGRADE$/, "")
    .replace(/_REDUIT$/, "");
}

function buildKnownCodes(vehicleTypes, coverageRules) {
  const profileCodes = new Set();
  const normalizedProfileCodes = new Set();

  Object.values(vehicleTypes || {}).forEach(type => {
    (type?.profils || []).forEach(profile => {
      const code = String(profile?.code || "").trim().toUpperCase();
      if (!code) {
        return;
      }
      profileCodes.add(code);
      normalizedProfileCodes.add(normalizeCode(code));
    });
  });

  const ruleKeys = new Set(Object.keys(coverageRules || {}).map(code => code.toUpperCase()));
  return { profileCodes, normalizedProfileCodes, ruleKeys };
}

function validate() {
  const root = path.resolve(__dirname, "..");
  const vehicleTypesPath = path.join(root, "data", "vehicule-types.js");
  const coverageRulesPath = path.join(root, "data", "coverage-rules.js");
  const interventionsPath = path.join(root, "data", "interventions.js");

  const VEHICULE_TYPES = loadGlobalFromScript(vehicleTypesPath, "VEHICULE_TYPES");
  const COVERAGE_RULES = loadGlobalFromScript(coverageRulesPath, "COVERAGE_RULES");
  const INTERVENTION_TEMPLATES = loadGlobalFromScript(interventionsPath, "INTERVENTION_TEMPLATES");

  const { profileCodes, normalizedProfileCodes, ruleKeys } = buildKnownCodes(VEHICULE_TYPES, COVERAGE_RULES);
  const errors = [];
  const warnings = [];

  Object.entries(COVERAGE_RULES || {}).forEach(([targetCode, rules]) => {
    const target = String(targetCode || "").toUpperCase();
    if (!target) {
      errors.push("Coverage rule avec code cible vide.");
      return;
    }
    if (!profileCodes.has(target) && !normalizedProfileCodes.has(target)) {
      warnings.push(`Coverage target \"${target}\" non trouve directement dans les profils vehicules.`);
    }
    (rules || []).forEach((rule, idx) => {
      const requires = Array.isArray(rule?.requires) ? rule.requires : [];
      if (requires.length === 0) {
        errors.push(`Coverage ${target} -> regle #${idx + 1} sans \"requires\".`);
      }
      requires.forEach(req => {
        const reqCode = String(req?.code || "").toUpperCase();
        if (!reqCode) {
          errors.push(`Coverage ${target} -> regle #${idx + 1} contient un code requirement vide.`);
          return;
        }
        if (!profileCodes.has(reqCode) && !normalizedProfileCodes.has(reqCode) && !ruleKeys.has(reqCode)) {
          errors.push(`Coverage ${target} -> code requirement inconnu \"${reqCode}\".`);
        }
      });
    });
  });

  (INTERVENTION_TEMPLATES || []).forEach((template, index) => {
    const label = template?.type || `template#${index + 1}`;
    const needs = Array.isArray(template?.besoins) ? template.besoins : [];
    const options = Array.isArray(template?.options) ? template.options : [];

    if (needs.length === 0) {
      errors.push(`[${label}] n'a aucun besoin obligatoire.`);
    }

    needs.forEach(need => {
      const code = String(need?.code || "").toUpperCase();
      if (!code) {
        errors.push(`[${label}] contient un besoin avec code vide.`);
        return;
      }
      if (!ruleKeys.has(code)) {
        errors.push(
          `[${label}] besoin inconnu \"${code}\" (pas de regle dans coverage-rules.js).`
        );
      }
    });

    options.forEach(option => {
      const code = String(option?.code || "").toUpperCase();
      if (!code) {
        errors.push(`[${label}] contient une option avec code vide.`);
        return;
      }
      if (!profileCodes.has(code) && !normalizedProfileCodes.has(code) && !ruleKeys.has(code)) {
        errors.push(`[${label}] option inconnue \"${code}\" (aucun profil/coverage).`);
      }
    });
  });

  if (errors.length === 0) {
    console.log(`OK: validation data metier reussie (${INTERVENTION_TEMPLATES.length} templates).`);
    if (warnings.length > 0) {
      console.log("Warnings:");
      warnings.forEach(w => console.log(`- ${w}`));
    }
    return 0;
  }

  console.error(`ERREUR: ${errors.length} probleme(s) detecte(s).`);
  errors.forEach(e => console.error(`- ${e}`));
  if (warnings.length > 0) {
    console.error("Warnings:");
    warnings.forEach(w => console.error(`- ${w}`));
  }
  return 1;
}

process.exit(validate());