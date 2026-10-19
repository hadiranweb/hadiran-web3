import { CasioLayerRadar } from "@/components/analyzers/CasioLayerRadar";
import { faNum, type InterpretationDocument } from "@/lib/analyzers/document-model";

function whenFa(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fa-IR");
}

function actionLines(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function CasioPageHead({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="casio-pagehead">
      <div className="casio-runhead">
        <div className="casio-runhead-profile">PROFILE 02 · RESEARCH</div>
        <div className="casio-runhead-title">گزارش ماتریسی شکاف · پروفایل پژوهش</div>
      </div>
      <div className="casio-head-kicker">{kicker}</div>
      <h1 className="casio-head-title">{title}</h1>
      {subtitle ? <div className="casio-head-subtitle">{subtitle}</div> : null}
      <div className="casio-head-hairline" />
    </div>
  );
}

function CasioPageFooter({ page, total, label }: { page: number; total: number; label: string }) {
  return (
    <div className="casio-page-footer">
      <div className="casio-footer-rule" />
      <div className="casio-footer-row">
        <div className="casio-footer-profile">
          <div>PROFILE 02</div>
          <div>RESEARCH</div>
        </div>
        <img className="casio-footer-seal" src="/casio-ss/logos/casio_seal_red.svg" alt="" />
        <div className="casio-footer-page">
          صفحهٔ {faNum(page)} از {faNum(total)} · {label}
        </div>
      </div>
    </div>
  );
}

export function CasioResearchDocument({ doc }: { doc: InterpretationDocument }) {
  const totalMax = doc.totalScoreMax ?? 100;
  const layerPages = doc.layers;
  const hasPatterns = doc.patterns.length > 0;
  const summaryPage = 2;
  const patternPage = hasPatterns ? 3 : null;
  const layerStart = hasPatterns ? 4 : 3;
  const closingPage = layerStart + layerPages.length;
  const totalPages = closingPage;

  const coverNote = [doc.personNameFa, doc.businessNameFa].filter(Boolean).join(" · ");

  return (
    <div className="doc-root doc-casio mx-auto w-[210mm] max-w-full">
      <style>{CASIO_DOC_CSS}</style>

      <section className="doc-page casio-page casio-cover">
        <img className="casio-cover-logo" src="/casio-ss/logos/casio_logo_light.svg" alt="لوگوی کاسیو" />
        <div className="casio-cover-tag">PROFILE 02 · RESEARCH</div>
        <div className="casio-cover-title-block">
          {doc.personNameFa ? <div className="casio-cover-eyebrow">{doc.personNameFa}</div> : null}
          <h1 className="casio-cover-title">{doc.packNameFa}</h1>
          {doc.businessNameFa ? <div className="casio-cover-subtitle">{doc.businessNameFa}</div> : null}
          <div className="casio-cover-rule" />
        </div>
        <div className="casio-cover-cards">
          <div className="casio-cover-card">
            <div className="casio-cover-card-label">گلوگاه بحرانی</div>
            <div className="casio-cover-card-value">{doc.bottleneckFa || "—"}</div>
            <div className="casio-cover-card-note">
              {doc.bottleneckScoreFa ? `${doc.bottleneckScoreFa} از ${faNum(20)}` : coverNote}
            </div>
          </div>
          <div className="casio-cover-card">
            <div className="casio-cover-card-label">نمره کل</div>
            <div className="casio-cover-card-score">
              <span className="casio-cover-score-number">{doc.totalFa ?? "—"}</span>
              <span className="casio-cover-score-of">از {faNum(totalMax)}</span>
            </div>
            <div className="casio-cover-card-note">بلوغ کلی: {doc.maturityFa || "—"}</div>
          </div>
        </div>
        <div className="casio-cover-footer">
          <div className="casio-cover-footer-rule" />
          <div className="casio-cover-footer-row">
            <div className="casio-cover-badge">PROFILE 02 · RESEARCH</div>
            <div className="casio-cover-footer-text">گزارش پاسخ‌ها و تفسیرها · {whenFa(doc.submittedAt)}</div>
          </div>
        </div>
      </section>

      <section className="doc-page casio-page">
        <CasioPageHead
          kicker="خلاصه مدیریتی · نمای پنج‌لایه"
          title="تصویر کلی شکاف"
          subtitle={coverNote || doc.packNameFa}
        />
        <div className="casio-pagehead-rule" />
        <div className="casio-summary-cards">
          <div className="casio-card">
            <div className="casio-card-label">نمره کل</div>
            <div className="casio-card-score">
              <span className="casio-card-score-number">{doc.totalFa ?? "—"}</span>
              <span className="casio-card-score-of">از {faNum(totalMax)}</span>
            </div>
            <div className="casio-card-note">بلوغ کلی: {doc.maturityFa || "—"}</div>
          </div>
          <div className="casio-card">
            <div className="casio-card-label">گلوگاه بحرانی</div>
            <div className="casio-card-value">{doc.bottleneckFa || "—"}</div>
            <div className="casio-card-note">
              {doc.bottleneckScoreFa ? `${doc.bottleneckScoreFa} از ${faNum(20)}` : whenFa(doc.submittedAt)}
            </div>
          </div>
        </div>

        {doc.layers.length >= 3 ? (
          <CasioLayerRadar
            points={doc.layers.map((layer) => ({
              id: layer.id,
              labelFa: layer.titleFa,
              value: layer.score,
              max: layer.scoreMax || 20,
              bottleneck: layer.isBottleneck,
            }))}
          />
        ) : null}

        {doc.context.length ? (
          <dl className="casio-context">
            {doc.context.map((field) => (
              <div key={field.labelFa}>
                <dt>{field.labelFa}</dt>
                <dd>{field.valueFa}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {doc.layers.length ? (
          <>
            <div className="casio-table-title">جدول خلاصه</div>
            <table className="casio-summary-table">
              <thead>
                <tr>
                  <th className="casio-col-layer">لایه</th>
                  <th className="casio-col-score">نمره از ۲۰</th>
                  <th className="casio-col-status">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {doc.layers.map((layer) => {
                  const ratio =
                    layer.score != null && layer.scoreMax > 0
                      ? Math.max(0, Math.min(100, (layer.score / layer.scoreMax) * 100))
                      : 0;
                  const weak = layer.isBottleneck;
                  return (
                    <tr key={layer.id}>
                      <td className="casio-cell-layer">
                        {layer.titleFa}
                        {weak ? <span className="casio-gap-mark">گلوگاه</span> : null}
                      </td>
                      <td className="casio-cell-score">
                        <div className="casio-score-line">
                          {layer.scoreFa} / {layer.scoreMaxFa}
                        </div>
                        <div className="casio-bar">
                          <div className="casio-bar-fill" style={{ width: `${ratio}%` }} />
                        </div>
                      </td>
                      <td className="casio-cell-status">
                        <span className={weak ? "casio-pill casio-pill-weak" : "casio-pill casio-pill-grow"}>
                          {layer.statusFa || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : doc.scores.length ? (
          <ul className="casio-score-list">
            {doc.scores.map((item) => (
              <li key={item.titleFa}>
                {item.titleFa}: {item.valueFa}
              </li>
            ))}
          </ul>
        ) : (
          <p className="casio-muted">نمره‌ای برای این نوبت ثبت نشده.</p>
        )}
        <div className="casio-note">
          این گزارش متن سؤال‌ها را نمایش نمی‌دهد؛ نمره‌ها و خوانش لایه‌ها از پاسخ‌های ثبت‌شده آمده‌اند.
        </div>
        <CasioPageFooter page={summaryPage} total={totalPages} label="گزارش تفسیر پاسخ‌ها" />
      </section>

      {hasPatterns && patternPage != null ? (
        <section className="doc-page casio-page">
          <CasioPageHead kicker="خوانش بین‌لایه" title="الگوهای مشترک" subtitle={doc.packNameFa} />
          <div className="casio-pagehead-rule" />
          <ul className="casio-patterns">
            {doc.patterns.map((pattern, index) => (
              <li key={index}>
                <p>{pattern.meaningFa}</p>
                <p className="casio-muted">{pattern.actionFa}</p>
              </li>
            ))}
          </ul>
          <CasioPageFooter page={patternPage} total={totalPages} label="گزارش تفسیر پاسخ‌ها" />
        </section>
      ) : null}

      {layerPages.map((layer, index) => {
        const actions = actionLines(layer.actionsFa);
        const weak = layer.isBottleneck;
        return (
          <section key={layer.id} className="doc-page casio-page">
            <CasioPageHead
              kicker="تفسیر لایه‌ها"
              title={layer.titleFa}
              subtitle="وضعیت موجود، وضعیت مطلوب و اقدامات فعال‌شده بر اساس پاسخ‌ها"
            />
            <div className="casio-pagehead-rule" />
            <div className="casio-layer-card">
              <div className="casio-layer-head">
                <div className={weak ? "casio-layer-badge casio-badge-weak" : "casio-layer-badge casio-badge-grow"}>
                  {faNum(index + 1)}
                </div>
                <div>
                  <div className="casio-layer-name">{layer.titleFa}</div>
                  <div className="casio-layer-score">
                    {layer.scoreFa} از {layer.scoreMaxFa}
                    {layer.statusFa ? ` · ${layer.statusFa}` : ""}
                    {weak ? " · گلوگاه" : ""}
                  </div>
                </div>
              </div>
              {layer.constructFa ? <p className="casio-construct">{layer.constructFa}</p> : null}
              {layer.asIsFa || layer.toBeFa ? (
                <div className="casio-asistobe">
                  {layer.asIsFa ? (
                    <div className="casio-asistobe-box">
                      <div className="casio-asistobe-label">وضعیت موجود · As-Is</div>
                      <div className="casio-asistobe-text">{layer.asIsFa}</div>
                    </div>
                  ) : null}
                  {layer.toBeFa ? (
                    <div className="casio-asistobe-box">
                      <div className="casio-asistobe-label">وضعیت مطلوب · To-Be</div>
                      <div className="casio-asistobe-text">{layer.toBeFa}</div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="casio-actions-label">اقدامات پیشنهادی فعال‌شده</div>
              {actions.length ? (
                actions.map((action, actionIndex) => (
                  <div key={actionIndex} className="casio-action">
                    <div className="casio-action-text">
                      <div className="casio-action-title">{action}</div>
                    </div>
                    <div className="casio-action-badge">{faNum(actionIndex + 1)}</div>
                  </div>
                ))
              ) : (
                <div className="casio-no-actions">اقدام فعال‌شده‌ای وجود ندارد.</div>
              )}
              <div className="casio-score-strip">
                <div className="casio-score-strip-label">نمرهٔ این لایه</div>
                <div className="casio-score-strip-value">
                  {layer.scoreFa} از {layer.scoreMaxFa}
                </div>
              </div>
            </div>
            <CasioPageFooter
              page={layerStart + index}
              total={totalPages}
              label="گزارش تفسیر پاسخ‌ها"
            />
          </section>
        );
      })}

      <section className="doc-page casio-page">
        <CasioPageHead kicker="پایان گزارش" title="یادداشت" subtitle={doc.packNameFa} />
        <div className="casio-pagehead-rule" />
        <p className="casio-closing">{doc.closingFa}</p>
        {doc.publicCode ? (
          <p className="casio-muted" dir="ltr">
            {doc.publicCode}
          </p>
        ) : null}
        <p className="casio-muted">نسخه {doc.version}</p>
        <CasioPageFooter page={closingPage} total={totalPages} label="گزارش تفسیر پاسخ‌ها" />
      </section>
    </div>
  );
}

const CASIO_DOC_CSS = `
@font-face {
  font-family: "Abar Low";
  src: url("/casio-ss/fonts/AbarLow-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
.doc-casio {
  --navy: #0E2841;
  --research-blue: #156082;
  --document-white: #E7EAEC;
  --deep-maroon: #7F0000;
  --cream: #F6F2E9;
  --muted: #5A6C7D;
  --soft: #F5F7F8;
  --row-alt: #F8F9FA;
  --card-bg: #FFFFFF;
  --card-border: #E1E6EA;
  --hairline: #C9D3DA;
  --bar-track: #E3E9ED;
  --box: #EDEFF2;
  --weak-bg: #F5E8E8;
  --weak-text: #7F0000;
  --grow-bg: #EDEFF2;
  --grow-text: #354B60;
  --cover-card-bg: #1F374E;
  --cover-text-muted: #C3CFDC;
  --cover-subtitle: #D7DFE7;
  font-family: "Abar Low", Vazirmatn, sans-serif;
  color: var(--navy);
  background: var(--document-white);
}
.doc-casio .casio-page {
  position: relative;
  background: #fff;
  min-height: 297mm;
  padding: 12pt 44pt 88pt;
  box-sizing: border-box;
  overflow: hidden;
}
.doc-casio .casio-cover {
  background: var(--navy);
  color: var(--cream);
  padding: 0 49pt 88pt;
  min-height: 297mm;
}
.doc-casio .casio-cover-logo {
  position: absolute;
  top: 63pt;
  right: 49pt;
  width: 85pt;
}
.doc-casio .casio-cover-tag {
  position: absolute;
  top: 74pt;
  left: 49pt;
  font-size: 8.2pt;
  font-weight: 600;
  letter-spacing: 2.6pt;
  color: var(--cover-text-muted);
}
.doc-casio .casio-cover-title-block { padding-top: 220pt; text-align: right; }
.doc-casio .casio-cover-eyebrow { font-size: 11pt; color: var(--cover-text-muted); }
.doc-casio .casio-cover-title {
  margin: 8pt 0 0;
  font-size: 30pt;
  font-weight: 700;
  line-height: 1.4;
  color: var(--cream);
  max-width: 280pt;
  margin-inline-start: auto;
}
.doc-casio .casio-cover-subtitle {
  margin-top: 16pt;
  font-size: 13pt;
  color: var(--cover-subtitle);
  line-height: 1.5;
}
.doc-casio .casio-cover-rule {
  margin-top: 18pt;
  margin-inline-start: auto;
  width: 127pt;
  height: 2pt;
  background: var(--research-blue);
}
.doc-casio .casio-cover-cards { display: flex; gap: 10pt; margin-top: 20pt; }
.doc-casio .casio-cover-card {
  flex: 1;
  background: var(--cover-card-bg);
  border: 0.9pt solid rgba(246,242,233,0.28);
  border-radius: 8pt;
  padding: 15pt 17pt;
  min-height: 120pt;
}
.doc-casio .casio-cover-card-label { font-size: 10pt; color: var(--cover-text-muted); }
.doc-casio .casio-cover-card-value {
  margin-top: 10pt;
  font-size: 20pt;
  font-weight: 700;
  color: var(--cream);
  line-height: 1.35;
}
.doc-casio .casio-cover-card-score { margin-top: 6pt; }
.doc-casio .casio-cover-score-number { font-size: 28pt; font-weight: 700; color: var(--cream); }
.doc-casio .casio-cover-score-of { font-size: 11.5pt; color: var(--cover-text-muted); margin-inline-start: 4pt; }
.doc-casio .casio-cover-card-note { margin-top: 8pt; font-size: 10.5pt; color: var(--cover-text-muted); }
.doc-casio .casio-cover-footer { position: absolute; right: 49pt; left: 49pt; bottom: 80pt; }
.doc-casio .casio-cover-footer-rule { height: 1pt; background: rgba(246,242,233,0.32); }
.doc-casio .casio-cover-footer-row {
  margin-top: 13pt;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.doc-casio .casio-cover-footer-text { font-size: 8.8pt; color: var(--cover-text-muted); }
.doc-casio .casio-cover-badge {
  background: var(--deep-maroon);
  color: var(--cream);
  font-size: 7.6pt;
  font-weight: 600;
  letter-spacing: 1.1pt;
  padding: 6pt 11pt;
  border-radius: 3pt;
}
.doc-casio .casio-runhead { display: flex; justify-content: space-between; align-items: baseline; }
.doc-casio .casio-runhead-profile {
  font-size: 7.8pt;
  font-weight: 600;
  letter-spacing: 1.4pt;
  color: var(--deep-maroon);
}
.doc-casio .casio-runhead-title { font-size: 8.8pt; color: var(--navy); }
.doc-casio .casio-head-kicker { margin-top: 16pt; font-size: 9pt; color: var(--deep-maroon); }
.doc-casio .casio-head-title { margin: 4pt 0 0; font-size: 22pt; font-weight: 700; color: var(--navy); }
.doc-casio .casio-head-subtitle { margin-top: 5pt; font-size: 10.5pt; color: var(--muted); }
.doc-casio .casio-head-hairline { margin-top: 11pt; height: 1pt; background: var(--research-blue); }
.doc-casio .casio-pagehead-rule { margin-top: 9pt; height: 2pt; display: flex; justify-content: space-between; }
.doc-casio .casio-pagehead-rule::before,
.doc-casio .casio-pagehead-rule::after { content: ""; width: 47.5%; }
.doc-casio .casio-pagehead-rule::before { background: var(--deep-maroon); }
.doc-casio .casio-pagehead-rule::after { background: var(--research-blue); }
.doc-casio .casio-summary-cards { display: flex; gap: 10pt; margin-top: 12pt; }
.doc-casio .casio-card {
  flex: 1;
  background: var(--card-bg);
  border: 0.9pt solid var(--card-border);
  border-radius: 8pt;
  padding: 13pt 16pt;
}
.doc-casio .casio-card-label { font-size: 10pt; color: var(--muted); }
.doc-casio .casio-card-score-number { font-size: 24pt; font-weight: 700; }
.doc-casio .casio-card-score-of { font-size: 11pt; color: var(--muted); margin-inline-start: 4pt; }
.doc-casio .casio-card-value { margin-top: 4pt; font-size: 18pt; font-weight: 700; }
.doc-casio .casio-card-note { margin-top: 3pt; font-size: 10.5pt; color: var(--muted); }
.doc-casio .casio-radar { margin: 14pt auto 4pt; text-align: center; }
.doc-casio .casio-radar svg { max-width: 100%; height: auto; }
.doc-casio .casio-radar figcaption { margin-top: 4pt; font-size: 9pt; color: var(--muted); }
.doc-casio .casio-radar-scale { margin-inline-start: 6pt; }
.doc-casio .casio-context {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8pt 16pt;
  margin-top: 12pt;
  font-size: 10.5pt;
}
.doc-casio .casio-context dt { color: var(--muted); }
.doc-casio .casio-table-title { margin: 14pt 0 6pt; font-size: 13pt; font-weight: 700; }
.doc-casio .casio-summary-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.doc-casio .casio-summary-table thead th {
  background: var(--navy);
  color: var(--cream);
  font-size: 9pt;
  font-weight: 600;
  padding: 6.5pt 10pt;
  text-align: right;
}
.doc-casio .casio-summary-table tbody tr:nth-child(even) td { background: var(--row-alt); }
.doc-casio .casio-summary-table tbody td {
  border-bottom: 0.9pt solid var(--card-border);
  padding: 6pt 9pt;
  font-size: 10.5pt;
  vertical-align: middle;
}
.doc-casio .casio-cell-layer { font-weight: 600; }
.doc-casio .casio-gap-mark { margin-inline-start: 6pt; font-size: 8pt; color: var(--deep-maroon); font-weight: 400; }
.doc-casio .casio-cell-score, .doc-casio .casio-cell-status { text-align: center; }
.doc-casio .casio-score-line { text-align: center; }
.doc-casio .casio-bar { margin-top: 4pt; height: 3.4pt; background: var(--bar-track); border-radius: 2pt; overflow: hidden; }
.doc-casio .casio-bar-fill { height: 3.4pt; background: var(--navy); }
.doc-casio .casio-pill {
  display: inline-block;
  padding: 2.4pt 6.5pt;
  border-radius: 7pt;
  font-size: 8.4pt;
}
.doc-casio .casio-pill-weak { background: var(--weak-bg); color: var(--weak-text); }
.doc-casio .casio-pill-grow { background: var(--grow-bg); color: var(--grow-text); }
.doc-casio .casio-note {
  margin-top: 12pt;
  background: var(--row-alt);
  border-inline-start: 3pt solid var(--deep-maroon);
  border-radius: 3pt;
  padding: 10pt 12pt;
  font-size: 9.6pt;
  color: var(--grow-text);
  line-height: 1.65;
}
.doc-casio .casio-layer-card {
  margin-top: 12pt;
  background: var(--card-bg);
  border: 0.9pt solid var(--card-border);
  border-radius: 8pt;
  padding: 12pt 15pt;
}
.doc-casio .casio-layer-head { display: flex; align-items: center; }
.doc-casio .casio-layer-badge {
  width: 24pt;
  height: 24pt;
  border-radius: 50%;
  color: var(--cream);
  font-size: 11.5pt;
  font-weight: 700;
  text-align: center;
  line-height: 24pt;
  margin-inline-end: 10pt;
  flex: none;
}
.doc-casio .casio-badge-weak { background: var(--deep-maroon); }
.doc-casio .casio-badge-grow { background: var(--navy); }
.doc-casio .casio-layer-name { font-size: 16pt; font-weight: 700; }
.doc-casio .casio-layer-score { font-size: 9.6pt; color: var(--muted); }
.doc-casio .casio-construct { margin-top: 8pt; font-size: 10pt; color: var(--muted); line-height: 1.6; }
.doc-casio .casio-asistobe { display: flex; gap: 8pt; margin-top: 10pt; }
.doc-casio .casio-asistobe-box {
  flex: 1;
  background: var(--box);
  border-radius: 6pt;
  padding: 8pt 11pt;
}
.doc-casio .casio-asistobe-label { font-size: 8.8pt; font-weight: 600; }
.doc-casio .casio-asistobe-text { margin-top: 3pt; font-size: 9.8pt; color: var(--grow-text); line-height: 1.5; }
.doc-casio .casio-actions-label { margin: 10pt 0 3pt; font-size: 9.4pt; color: var(--muted); }
.doc-casio .casio-action {
  display: flex;
  align-items: center;
  border: 0.9pt solid #E4E9ED;
  border-radius: 6pt;
  padding: 6pt 10pt;
  margin-top: 5pt;
}
.doc-casio .casio-action-title { font-size: 11pt; line-height: 1.4; }
.doc-casio .casio-action-badge {
  flex: none;
  width: 14.5pt;
  height: 14.5pt;
  border-radius: 50%;
  background: var(--navy);
  color: var(--cream);
  font-size: 8.4pt;
  text-align: center;
  line-height: 14.5pt;
  margin-inline-start: 10pt;
}
.doc-casio .casio-no-actions {
  border: 1pt dashed #C8D2DA;
  border-radius: 6pt;
  padding: 8pt;
  text-align: center;
  font-size: 9.4pt;
  color: var(--muted);
}
.doc-casio .casio-score-strip {
  margin-top: 10pt;
  background: var(--navy);
  border-radius: 4pt;
  padding: 6pt 12pt;
  display: flex;
  justify-content: space-between;
  color: var(--cream);
}
.doc-casio .casio-score-strip-value { font-weight: 700; }
.doc-casio .casio-page-footer {
  position: absolute;
  left: 44pt;
  right: 44pt;
  bottom: 56pt;
}
.doc-casio .casio-footer-rule { height: 1pt; background: var(--hairline); }
.doc-casio .casio-footer-row {
  margin-top: 8pt;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.doc-casio .casio-footer-profile {
  font-size: 7.4pt;
  font-weight: 600;
  letter-spacing: 0.6pt;
  color: var(--deep-maroon);
  text-align: center;
  line-height: 1.4;
}
.doc-casio .casio-footer-seal { width: 14pt; }
.doc-casio .casio-footer-page { font-size: 8.8pt; color: var(--muted); }
.doc-casio .casio-muted { color: var(--muted); font-size: 10pt; margin-top: 8pt; }
.doc-casio .casio-patterns { margin-top: 16pt; padding: 0; list-style: none; }
.doc-casio .casio-patterns li { margin-bottom: 14pt; font-size: 11pt; line-height: 1.7; }
.doc-casio .casio-closing { margin-top: 18pt; font-size: 12pt; line-height: 1.8; }
.doc-casio .casio-score-list { margin-top: 12pt; font-size: 11pt; }
@media print {
  .doc-casio, .doc-casio .casio-page, .doc-casio .casio-cover, .doc-casio .casio-bar-fill,
  .doc-casio .casio-score-strip, .doc-casio .casio-cover-card, .doc-casio .casio-pill {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-casio .casio-page { min-height: 297mm; }
}
`;
