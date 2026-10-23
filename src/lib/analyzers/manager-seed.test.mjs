import test from "node:test";
import assert from "node:assert/strict";

test("بذر مدیر: هر دو آزمون تازه مثل آزمون دستی معتبر، باز و کلونِ مستقل‌اند", async () => {
  const { assertPack, itemsOf } = await import("./pack.ts");
  const { buildMindsetAuthoredPack } = await import("./mindset-gate/authored-pack.ts");
  const { buildSystemDiagnosisAuthoredPack } = await import("./system-diagnosis/authored-pack.ts");
  const { mindsetGatePack } = await import("./mindset-gate/pack.ts");
  const { systemDiagnosisPack } = await import("./system-diagnosis/pack.ts");

  for (const [build, code] of [
    [buildMindsetAuthoredPack, mindsetGatePack],
    [buildSystemDiagnosisAuthoredPack, systemDiagnosisPack],
  ]) {
    const pack = build();
    assertPack(pack);
    assert.equal(pack.slug, code.slug);
    assert.equal(pack.status, "open");
    assert.equal(pack.version, code.version);
    assert.equal(itemsOf(pack).length, itemsOf(code).length);
    // کلون عمیق: ویرایش بذر نباید پک کد را آلوده کند.
    pack.nameFa = "تغییرکرده";
    assert.notEqual(code.nameFa, "تغییرکرده");
  }
});

test("بذر مدیر از sanitizePack (همان فیلتر آزمون‌های دستی) بدون افت نمره می‌گذرد", async () => {
  const { sanitizePack } = await import("./sanitize.ts");
  const { scorePack } = await import("./score.ts");
  const { itemsOf } = await import("./pack.ts");
  const { buildMindsetAuthoredPack } = await import("./mindset-gate/authored-pack.ts");
  const { buildSystemDiagnosisAuthoredPack } = await import("./system-diagnosis/authored-pack.ts");

  for (const build of [buildMindsetAuthoredPack, buildSystemDiagnosisAuthoredPack]) {
    const pack = build();
    const clean = sanitizePack(JSON.parse(JSON.stringify(pack)), pack.slug);
    assert.ok(clean.ok, pack.slug);
    const answers = {};
    for (const item of itemsOf(pack)) {
      answers[item.id] = item.kind === "range" ? 7 : item.kind === "choice" ? (item.options[0]?.value ?? "") : "نمونه";
    }
    assert.equal(JSON.stringify(scorePack(clean.pack, answers)), JSON.stringify(scorePack(pack, answers)), pack.slug);
    assert.equal(itemsOf(clean.pack).length, itemsOf(pack).length, pack.slug);
    assert.equal(clean.pack.formulas.length, pack.formulas.length, pack.slug);
  }
});
