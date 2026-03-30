function normalizeProfilCode(profil) {
  if (profil.code === "INC6" && profil.mode === "degrade") {
    return "INC6_DEGRADE";
  }

  if (profil.code === "INC6" && profil.mode === "reduit") {
    return "INC6_REDUIT";
  }

  if (profil.code === "INC4" && profil.mode === "degrade") {
    return "INC4_DEGRADE";
  }

  return profil.code;
}

function countEngagementsByCode(engagements, code) {
  return engagements.filter(engagement => engagement.code === code).length;
}

function isRequirementSatisfied(requirement, engagements) {
  return countEngagementsByCode(engagements, requirement.code) >= requirement.quantite;
}

function isRuleSatisfied(rule, engagements) {
  return rule.requires.every(requirement =>
    isRequirementSatisfied(requirement, engagements)
  );
}

function countSatisfiedCopiesOfRule(rule, engagements) {
  if (!rule || !Array.isArray(rule.requires) || rule.requires.length === 0) {
    return 0;
  }

  return Math.min(
    ...rule.requires.map(requirement => {
      const available = countEngagementsByCode(engagements, requirement.code);
      return Math.floor(available / requirement.quantite);
    })
  );
}

function getCoverageForBesoin(besoinCode, engagements, requiredQty = 1) {
  const rules = window.COVERAGE_RULES?.[besoinCode] || [];

  let bestCoveredQty = 0;
  let bestRuleLabel = null;

  for (const rule of rules) {
    const coveredQty = countSatisfiedCopiesOfRule(rule, engagements);

    if (coveredQty > bestCoveredQty) {
      bestCoveredQty = coveredQty;
      bestRuleLabel = rule.label;
    }
  }

  return {
    covered: bestCoveredQty >= requiredQty,
    coveredQty: bestCoveredQty,
    requiredQty,
    ruleLabel: bestRuleLabel
  };
}

function getCoverageDetails(intervention, engagements) {
  return intervention.besoins.map(besoin => {
    const requiredQty = besoin.quantite || 1;
    const result = getCoverageForBesoin(besoin.code, engagements, requiredQty);

    return {
      code: besoin.code,
      quantite: requiredQty,
      covered: result.covered,
      coveredQty: result.coveredQty,
      ruleLabel: result.ruleLabel
    };
  });
}

function getCoverageSummary(intervention, engagements) {
  const details = getCoverageDetails(intervention, engagements);

  return {
    details,
    covered: details.every(detail => detail.covered)
  };
}

window.normalizeProfilCode = normalizeProfilCode;
window.countEngagementsByCode = countEngagementsByCode;
window.isRequirementSatisfied = isRequirementSatisfied;
window.isRuleSatisfied = isRuleSatisfied;
window.getCoverageForBesoin = getCoverageForBesoin;
window.getCoverageDetails = getCoverageDetails;