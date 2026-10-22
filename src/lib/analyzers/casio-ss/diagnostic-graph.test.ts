import assert from "node:assert/strict";
import { test } from "node:test";
import { gateOf } from "@/lib/analyzers/gate";
import { mindsetGatePack } from "@/lib/analyzers/mindset-gate/instrument";
import { itemsOf } from "@/lib/analyzers/pack";
import { sanitizePack } from "@/lib/analyzers/sanitize";
import { scorePack } from "@/lib/analyzers/score";
import { buildCasioAuthoredPack } from "./authored-pack";
import { DIAG_DIMENSIONS, SCR_ITEMS } from "./deep-dive-a3";
import {
  resolveInterDomainBridge,
  runArchetypeCalibrationSuite,
  toCasioDomainPortOutput,
  toMindsetDomainPortOutput,
} from "./domain-bridge";
import {
  CAUSAL_KEYWORD_EDGES,
  CODING_STANDARD_VERSION,
  fromCanonicalCode,
  toCanonicalCode,
} from "./coding-causal-graph";
import {
  HADIRAN_SSOT_BRANCH,
  HADIRAN_SSOT_REPOSITORY,
  HADIRAN_SSOT_VERSION,
  buildAllCanonicalPacks,
  getSsotManifestSummary,
  listAllCanonicalItems,
} from "../ssot-registry";
import { casioSsPack } from "./instrument";
import { casioKeywordEdges, casioKeywords, layerCopy } from "./interpretation";
import { KEYWORD_ONTOLOGY, RESEARCH_SOURCES, VAULT_CONCEPTS } from "./ontology-graph";
import { buildCasioReport } from "./report";

function baseAnswers(defaultScore = 5): Record<string, number | string> {
  const answers: Record<string, number | string> = {
    "BIZ.1": "شرکت نمونه",
    "BIZ.2": "service",
    "BIZ.3": "نرم‌افزار",
    "BIZ.4": "6-20",
    "BIZ.5": "3-5",
    "BIZ.6": "3-5",
  };
  for (let l = 1; l <= 5; l += 1) {
    for (let q = 1; q <= 4; q += 1) {
      answers[`FL.L${l}.Q${q}`] = defaultScore;
    }
  }
  return answers;
}

test("Stage 1: mindset-gate is separated from casio-ss", () => {
  const casioItemIds = itemsOf(casioSsPack).map((item) => item.id);
  const mindsetItemIds = itemsOf(mindsetGatePack).map((item) => item.id);

  assert.equal(
    casioItemIds.some((id) => id.startsWith("MG.")),
    false,
    "casio-ss must not contain MG.* mindset items",
  );
  assert.equal(casioItemIds.filter((id) => id.startsWith("BIZ.")).length, 6);
  assert.equal(casioItemIds.filter((id) => id.startsWith("FL.")).length, 20);
  assert.equal(mindsetItemIds.length, 12);
  assert.equal(mindsetItemIds.every((id) => id.startsWith("MG.")), true);
});

test("Stage 2: all 20 FL items (including FL.L5.Q4) have weighted & cross-layer edges, and all 75 sub-keywords are defined", () => {
  const flItems = itemsOf(casioSsPack)
    .map((item) => item.id)
    .filter((id) => id.startsWith("FL."));
  assert.equal(flItems.length, 20);

  for (const itemId of flItems) {
    const outgoing = casioKeywordEdges.filter((edge) => edge.from === itemId);
    assert.ok(outgoing.length >= 2, `${itemId} must connect to at least 2 keywords`);
  }

  // Verify FL.L5.Q4 (Unit Economics) is no longer orphaned
  const q4Edges = casioKeywordEdges.filter((edge) => edge.from === "FL.L5.Q4");
  assert.ok(q4Edges.some((edge) => edge.to === "L5-K2" && edge.weight >= 0.8));

  // Verify 75 sub-keywords exist with unique IDs
  const subKeywords = layerCopy.flatMap((layer) =>
    layer.keywords.flatMap((kw) => kw.subKeywords ?? []),
  );
  assert.equal(subKeywords.length, 75);
  assert.equal(new Set(subKeywords.map((sk) => sk.id)).size, 75);
});

test("Stage 1 & 2: scorePack and buildCasioReport compute real 0..20 scores for all 15 keywords and dynamically tailor report copy", () => {
  const pack = buildCasioAuthoredPack();
  const clean = sanitizePack(pack, "casio-ss");
  assert.equal(clean.ok, true);

  // Scenario A: Owner has 10/10 on financial separation (FL.L1.Q4 = 10),
  // but severe founder trap on FL.L1.Q1 = 0 and FL.L1.Q2 = 10 (reverse-scored -> effective 0)
  const answersA = baseAnswers(6);
  answersA["FL.L1.Q1"] = 0;
  answersA["FL.L1.Q2"] = 10; // reverse -> 0
  answersA["FL.L1.Q3"] = 8;
  answersA["FL.L1.Q4"] = 10; // perfect financial separation

  const scoredA = scorePack(pack, answersA);
  for (const kw of casioKeywords) {
    assert.equal(typeof scoredA.scores[kw.id], "number", `missing score for ${kw.id}`);
  }

  const reportA = buildCasioReport(pack, answersA, scoredA);
  const layer1A = reportA.layers.find((l) => l.id === "layer-foundation")!;
  const k2A = layer1A.keywords.find((k) => k.id === "L1-K2")!;
  const k3A = layer1A.keywords.find((k) => k.id === "L1-K3")!;

  assert.ok((k2A.score ?? 0) >= 16, `Expected L1-K2 to be strong, got ${k2A.score}`);
  assert.ok((k3A.score ?? 20) <= 5, `Expected L1-K3 to be weak, got ${k3A.score}`);
  assert.equal(layer1A.keywords[0]?.id, "L1-K3", "Weakest keyword L1-K3 must be ranked #1 in Layer 1");
  assert.ok(layer1A.actionsFa.includes("آزادسازی زمان مالک"));
  assert.equal(
    layer1A.actionsFa.includes("اصلاح برداشت‌های مالی"),
    false,
    "Should not prescribe fixing financial withdrawals when L1-K2 is strong",
  );

  // Scenario B: Flip Layer 1 -> Owner is independent (FL.L1.Q1 = 10, FL.L1.Q2 = 0),
  // but personal and company finances are completely mixed (FL.L1.Q4 = 0)
  const answersB = baseAnswers(8);
  answersB["FL.L1.Q1"] = 10;
  answersB["FL.L1.Q2"] = 0; // reverse -> 10
  answersB["FL.L1.Q3"] = 9;
  answersB["FL.L1.Q4"] = 0; // mixed finances

  const reportB = buildCasioReport(pack, answersB, null);
  const layer1B = reportB.layers.find((l) => l.id === "layer-foundation")!;
  assert.equal(layer1B.keywords[0]?.id, "L1-K2", "Weakest keyword L1-K2 must now be ranked #1 in Layer 1");
  assert.ok(layer1B.actionsFa.includes("اصلاح برداشت‌های مالی"));
});

test("Stage 3: Ontology Graph maps all 15 keywords to Rummler 9-Box, Nadler-Tushman, Vault Concepts, and Sources S022..S055", () => {
  assert.equal(KEYWORD_ONTOLOGY.length, 15, "All 15 keywords must have ontology entries");
  for (const entry of KEYWORD_ONTOLOGY) {
    assert.ok(entry.vaultConceptIds.length > 0, `Keyword ${entry.keywordId} missing vaultConceptIds`);
    assert.ok(entry.sourceIds.length > 0, `Keyword ${entry.keywordId} missing sourceIds`);
    for (const cid of entry.vaultConceptIds) {
      assert.ok(VAULT_CONCEPTS[cid], `Unknown vault concept ${cid} on ${entry.keywordId}`);
    }
    for (const sid of entry.sourceIds) {
      assert.ok(RESEARCH_SOURCES[sid], `Unknown research source ${sid} on ${entry.keywordId}`);
    }
  }

  const pack = buildCasioAuthoredPack();
  const answers = baseAnswers(3); // weak across the board
  const report = buildCasioReport(pack, answers, null);
  assert.ok(report.ontology, "Report must include ontology diagnosis summary");
  assert.equal(report.ontology!.rummlerBreakdown.length, 3, "Must compute 3 Rummler-Brache levels");
  assert.ok(report.ontology!.activatedSources.length >= 5, "Must activate relevant Research Sources");
  assert.ok(report.ontology!.activatedConcepts.length >= 5, "Must activate relevant Vault Concepts");
  assert.ok(report.ontology!.primaryNadlerDisconnectFa.length > 10);
});

test("Stage 4: Context Modulation Tensor (BIZ.2..BIZ.6) adapts priorities, copy, and cross-patterns for Solo vs 6-20 vs Old firms", () => {
  const pack = buildCasioAuthoredPack();

  // Case 1: Solopreneur (BIZ.4 = "solo") with uniform effective score = 2 across all 20 FL items
  const soloAnswers = baseAnswers(2);
  for (const revId of ["FL.L1.Q2", "FL.L2.Q3", "FL.L3.Q2", "FL.L4.Q3", "FL.L5.Q3"]) {
    soloAnswers[revId] = 8; // reverse -> effective 2
  }
  soloAnswers["BIZ.4"] = "solo";
  const soloReport = buildCasioReport(pack, soloAnswers, null);
  assert.equal(soloReport.contextProfile?.teamSize, "solo");
  const soloLayer3 = soloReport.layers.find((l) => l.id === "layer-flow")!;
  // In a solo business with equal effective item scores, L3-K3 (continuity/automation, weight 1.20) must outrank L3-K1 (delegation, weight 0.70)
  assert.equal(
    soloLayer3.keywords[0]?.id,
    "L3-K3",
    "In a solo business, L3-K3 (continuity) must be prioritized above multi-person delegation L3-K1",
  );
  const soloL3K1 = soloLayer3.keywords.find((k) => k.id === "L3-K1")!;
  assert.ok(
    soloL3K1.actionStepFa?.includes("C1"),
    "Solopreneur L3-K1 action copy must reference C1 order-filtering / outsourcing instead of staff delegation",
  );
  assert.ok(
    soloReport.patterns.some((p) => p.id === "context_solopreneur_c1_c9"),
    "Must trigger context_solopreneur_c1_c9 pattern for solo business",
  );

  // Case 2: 6-20 person team (BIZ.4 = "6-20" -> Greiner Crisis of Autonomy) with uniform effective score = 2
  const teamAnswers = baseAnswers(2);
  for (const revId of ["FL.L1.Q2", "FL.L2.Q3", "FL.L3.Q2", "FL.L4.Q3", "FL.L5.Q3"]) {
    teamAnswers[revId] = 8; // reverse -> effective 2
  }
  teamAnswers["BIZ.4"] = "6-20";
  const teamReport = buildCasioReport(pack, teamAnswers, null);
  const teamLayer3 = teamReport.layers.find((l) => l.id === "layer-flow")!;
  assert.equal(
    teamLayer3.keywords[0]?.id,
    "L3-K1",
    "In a 6-20 person team, L3-K1 (decision rights / delegation) must be prioritized #1 in Layer 3",
  );
  assert.ok(
    teamReport.patterns.some((p) => p.id === "context_greiner_autonomy_crisis"),
    "Must trigger context_greiner_autonomy_crisis for 6-20 team with weak Layer 3",
  );

  // Case 3: Older firm (BIZ.6 = "10+") with weak foundation & architecture -> Structural Inertia
  const oldFirmAnswers = baseAnswers(3);
  oldFirmAnswers["BIZ.4"] = "21-50";
  oldFirmAnswers["BIZ.6"] = "10+";
  const oldFirmReport = buildCasioReport(pack, oldFirmAnswers, null);
  assert.ok(
    oldFirmReport.patterns.some((p) => p.id === "context_structural_inertia"),
    "Must trigger context_structural_inertia for 10+ year firm with low formalization",
  );
  assert.ok(
    oldFirmReport.patterns.some((p) => p.id === "context_whitespace_control_crisis"),
    "Must trigger context_whitespace_control_crisis for 21-50 team with weak architecture/monitoring",
  );
});

test("Stage 5: 89-Item Hierarchical Bank (15 SCR + 20 FL + 54 DIAG), CD-MST Routing, and 1-page A3 / PDSA Action Sheet", () => {
  assert.equal(SCR_ITEMS.length, 15, "Must have 15 SCR screening items (SCR.s01..s15)");
  assert.equal(DIAG_DIMENSIONS.length, 9, "Must have 9 DIAG dimensions (d1..d9)");
  const totalDiagItems = DIAG_DIMENSIONS.reduce((sum, dim) => sum + dim.items.length, 0);
  assert.equal(totalDiagItems, 54, "Must have 54 DIAG items (DIAG.d101..d906)");

  const pack = buildCasioAuthoredPack();
  // Create a profile where financial separation (L1-K2) and unit economics (L5-K2) are critically weak
  const finWeakAnswers = baseAnswers(8);
  for (const revId of ["FL.L1.Q2", "FL.L2.Q3", "FL.L3.Q2", "FL.L4.Q3", "FL.L5.Q3"]) {
    finWeakAnswers[revId] = 2; // reverse -> effective 8
  }
  finWeakAnswers["FL.L1.Q4"] = 0; // mixed finances -> L1-K2 weak
  finWeakAnswers["FL.L5.Q4"] = 0; // poor unit economics -> L5-K2 weak
  finWeakAnswers["FL.L5.Q2"] = 1;

  const report = buildCasioReport(pack, finWeakAnswers, null);
  assert.ok(report.deepDive, "Report must include Stage 5 deepDive summary");
  assert.equal(report.deepDive!.totalBankItemsCount, 89);
  assert.equal(report.deepDive!.recommendedModules.length, 2);
  // Dimension d8 (financial discipline, unit cost, cashflow) must be routed as the #1 Stage-2 module
  assert.equal(
    report.deepDive!.recommendedModules[0]?.dimensionId,
    "d8",
    "Financial & unit-economics weakness must route to d8 (DIAG.d801..d806) as #1 deep-dive module",
  );

  // Verify A3 Action Sheet & 14-day PDSA card fidelity criteria (Shook 2008 S051 + Taylor et al. 2014 S022)
  const a3 = report.deepDive!.a3Sheet;
  assert.ok(a3.titleFa.includes("A3"));
  assert.ok(a3.backgroundFa.length > 20);
  assert.ok(a3.currentConditionFa.length > 20);
  assert.ok(a3.multiLevelRootCause.organizationRootFa.includes("سطح کلان سازمان"));
  assert.ok(a3.multiLevelRootCause.processRootFa.includes("سطح فرایند"));
  assert.ok(a3.multiLevelRootCause.performerRootFa.includes("بدون سرزنش فردی"));
  assert.equal(a3.pdsaCard.cycleDurationDays, 14);
  assert.equal(a3.pdsaCard.fidelityChecklistFa.length, 4);
});

test("Stage 6: Inter-Domain Bridge Protocol (DomainBridgePort) & Synthetic Archetype Calibration Suite", () => {
  // 1. Run Synthetic Archetype Calibration Suite across all canonical personas
  const calibrationResults = runArchetypeCalibrationSuite();
  assert.ok(calibrationResults.length >= 4);
  for (const res of calibrationResults) {
    assert.equal(
      res.passed,
      true,
      `Synthetic archetype ${res.archetypeId} failed calibration: bottleneck=${res.actualBottleneckLayerId}, patterns=${res.actualPatternIds.join(",")}, topWeak=${res.topWeakKeywordIds.join(",")}`,
    );
  }

  // 2. Verify Inter-Domain Bridge Resolver between independent mindset-gate and casio-ss packs
  const casioPack = buildCasioAuthoredPack();
  const founderTrapAnswers = baseAnswers(2);
  for (const revId of ["FL.L1.Q2", "FL.L2.Q3", "FL.L3.Q2", "FL.L4.Q3", "FL.L5.Q3"]) {
    founderTrapAnswers[revId] = 8; // reverse -> effective 2
  }
  const casioReport = buildCasioReport(casioPack, founderTrapAnswers, null);
  const casioPort = toCasioDomainPortOutput(casioReport);

  // Low control / low problem-solving mindset answers on standalone mindsetGatePack
  const lowMindsetAnswers: Record<string, number | string> = {
    "MG.A1": 1,
    "MG.A2": 1,
    "MG.A3": 9, // reverse -> 1
    "MG.A4": 1,
    "MG.B1": 1,
    "MG.B2": 1,
    "MG.B3": 9, // reverse -> 1
    "MG.B4": 1,
    "MG.C1": 1,
    "MG.C2": 1,
    "MG.C3": 9, // reverse -> 1
    "MG.C4": 1,
  };
  const mindsetScored = scorePack(mindsetGatePack, lowMindsetAnswers);
  const mindsetOutcome = gateOf(mindsetGatePack, mindsetScored)!;
  const mindsetPort = toMindsetDomainPortOutput(mindsetOutcome);

  const bridgeInsights = resolveInterDomainBridge(casioPort, mindsetPort);
  assert.ok(
    bridgeInsights.some((b) => b.id === "bridge_psychological_delegation_barrier"),
    "Must detect psychological delegation barrier when L1-K3/L3-K1 and mindset control are both low",
  );
  assert.ok(
    bridgeInsights.some((b) => b.id === "bridge_blame_attribution_vs_rca"),
    "Must detect person-blame attribution bias when L4-K3 and mindset problem-solving are both low",
  );
});

test("Stage 7: Canonical Coding System (HADIRAN-CODING-2.0.0) & DEMATEL/ISM/MICMAC Causal Influencer/Influenced Graph", () => {
  // 1. Canonical coding round-trip across all entity axes
  const roundTripPairs: [string, string][] = [
    ["casio-ss", "DOM.CASIO_SS"],
    ["mindset-gate", "DOM.MINDSET_GATE"],
    ["BIZ.4", "CTX.BIZ.04"],
    ["layer-foundation", "LYR.L1"],
    ["layer-scale", "LYR.L5"],
    ["L1-K3", "KW.L1.K3"],
    ["L5-K2", "KW.L5.K2"],
    ["L3-K1-S4", "SKW.L3.K1.S4"],
    ["FL.L5.Q4", "ITM.FL.L5.Q4"],
    ["SCR.s07", "ITM.SCR.S07"],
    ["DIAG.d103", "ITM.DIAG.D1.03"],
    ["MG.A2", "ITM.MND.A2"],
    ["d1_decision", "DIM.D1"],
    ["C4", "PRC.C4"],
    ["V05", "VLT.V05"],
    ["S050", "SRC.S050"],
  ];
  for (const [legacy, canonical] of roundTripPairs) {
    assert.equal(toCanonicalCode(legacy), canonical, `Expected ${legacy} -> ${canonical}`);
    assert.equal(fromCanonicalCode(canonical), legacy, `Expected ${canonical} -> ${legacy}`);
  }

  // 2. Verify DEMATEL / ISM / MICMAC causal edges and report integration
  assert.ok(CAUSAL_KEYWORD_EDGES.length >= 28, "Expected at least 28 directed causal edges");

  const pack = buildCasioAuthoredPack();
  const answers = baseAnswers(6);
  // Make L5 (downstream outcome) and L1 (upstream root cause) weak to trigger symptom trap
  answers["FL.L1.Q1"] = 2;
  answers["FL.L1.Q2"] = 8; // reverse -> 2
  answers["FL.L1.Q3"] = 2;
  answers["FL.L1.Q4"] = 2;
  answers["FL.L5.Q1"] = 1;
  answers["FL.L5.Q2"] = 1;
  answers["FL.L5.Q3"] = 9; // reverse -> 1
  answers["FL.L5.Q4"] = 1;

  const report = buildCasioReport(pack, answers, null);
  assert.ok(report.causalGraph, "Report must include causalGraph summary");
  assert.equal(report.causalGraph!.codingVersion, CODING_STANDARD_VERSION);

  const allKeywords = report.layers.flatMap((l) => l.keywords);
  assert.equal(allKeywords.length, 15);
  for (const layer of report.layers) {
    assert.match(layer.canonicalCode ?? "", /^LYR\.L[1-5]$/);
  }
  for (const kw of allKeywords) {
    assert.match(kw.canonicalCode ?? "", /^KW\.L[1-5]\.K[1-3]$/);
    assert.ok(typeof kw.drivingPower === "number" && kw.drivingPower >= 0);
    assert.ok(typeof kw.dependencePower === "number" && kw.dependencePower >= 0);
    assert.ok(typeof kw.rootCauseLeverageScore === "number");
    assert.ok(
      (kw.influencersFa?.length ?? 0) > 0 || (kw.influencedFa?.length ?? 0) > 0,
      `Keyword ${kw.id} must have upstream influencers or downstream influenced nodes`,
    );
    for (const sub of kw.scoredSubKeywords ?? []) {
      assert.match(sub.canonicalCode ?? "", /^SKW\.L[1-5]\.K[1-3]\.S[1-5]$/);
    }
  }

  // Verify L1-K1 and L2-K2 are net Cause Drivers (D - R > 0) and L5-K2 is a net Effect Symptom (D - R < 0)
  const l1k1 = allKeywords.find((k) => k.id === "L1-K1")!;
  const l2k2 = allKeywords.find((k) => k.id === "L2-K2")!;
  const l5k2 = allKeywords.find((k) => k.id === "L5-K2")!;
  assert.equal(l1k1.causalRole, "cause_driver");
  assert.ok((l1k1.netCauseEffect ?? 0) > 0);
  assert.equal(l2k2.causalRole, "cause_driver");
  assert.ok((l2k2.netCauseEffect ?? 0) > 0);
  assert.equal(l5k2.causalRole, "effect_symptom");
  assert.ok((l5k2.netCauseEffect ?? 0) < 0);

  // Verify Symptom-Treatment Trap warning fires when L5 symptom is weak and upstream drivers are weak
  assert.ok(
    report.causalGraph!.symptomTrapWarningFa &&
      report.causalGraph!.symptomTrapWarningFa.includes("هشدار تلهٔ معلول‌درمانی"),
    "Must emit symptom-treatment trap warning when downstream L5 node is weakest while upstream influencers are weak",
  );
});

test("Stage 8: Single Source of Truth (HADIRAN-SSOT-2.0.0) in hadiranweb/hadiran-web3 (arena/1b7c6093-hadiran-web3)", () => {
  const manifest = getSsotManifestSummary();
  assert.equal(manifest.ssotVersion, HADIRAN_SSOT_VERSION);
  assert.equal(manifest.repository, HADIRAN_SSOT_REPOSITORY);
  assert.equal(manifest.branch, HADIRAN_SSOT_BRANCH);

  // Verify complete counts in the unified SSOT
  assert.equal(manifest.counts.domains, 2);
  assert.equal(manifest.counts.layers, 5);
  assert.equal(manifest.counts.keywords, 15);
  assert.equal(manifest.counts.subKeywords, 75);
  assert.equal(manifest.counts.researchSources, 55, "All 55 research sources S001..S055 must live in SSOT");
  assert.equal(manifest.counts.soloProcesses, 9);
  assert.equal(manifest.counts.deepDiveDimensions, 9);
  assert.equal(manifest.counts.totalCanonicalItems, 107);
  assert.deepEqual(manifest.counts.itemsByTier, {
    BIZ: 6,
    FL: 20,
    SCR: 15,
    DIAG: 54,
    MND: 12,
  });

  // Verify all 107 items have unique canonical codes and round-trip cleanly
  const items = listAllCanonicalItems();
  const seenCodes = new Set<string>();
  for (const item of items) {
    assert.equal(seenCodes.has(item.canonicalCode), false, `Duplicate canonical code ${item.canonicalCode}`);
    seenCodes.add(item.canonicalCode);
    assert.equal(fromCanonicalCode(item.canonicalCode), item.legacyId);
  }

  // Verify both canonical packs sanitize cleanly
  const packs = buildAllCanonicalPacks();
  assert.equal(packs.length, 2);
  for (const pack of packs) {
    const clean = sanitizePack(pack, pack.slug);
    assert.equal(clean.ok, true, `Canonical pack ${pack.slug} failed sanitizePack`);
  }
});




