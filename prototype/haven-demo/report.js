const reportRoot = document.querySelector("#report");
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]);
const formatLabel = (key) => key.replace(/([A-Z])/g, " $1").replace(/^./, character => character.toUpperCase());
let assessment;
try { assessment = JSON.parse(sessionStorage.getItem("heif-printable-report")); } catch { assessment = null; }
let appearance = { theme: "coastal", organization: "HEIF" };
try { appearance = { ...appearance, ...JSON.parse(sessionStorage.getItem("heif-report-appearance")) }; } catch { /* Use the default presentation. */ }
document.body.dataset.theme = appearance.theme;

if (!assessment) {
  reportRoot.innerHTML = `<section class="empty"><h1>No assessment report is ready</h1><p>Return to the assessment and select <strong>View printable report</strong>.</p><p><a href="index.html">Back to assessment</a></p></section>`;
} else {
  document.title = `HEIF Assessment Report · ${assessment.discovery.establishment}`;
  const discoveryRows = Object.entries(assessment.discovery).map(([key, value]) => `<tr><th>${escapeHtml(formatLabel(key))}</th><td>${escapeHtml(value)}</td></tr>`).join("");
  const focusRows = assessment.focusAreas.filter(([, , inScope]) => inScope).map(([name, priority]) => `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(priority)}</td></tr>`).join("");
  const observationRows = assessment.observations.map(observation => `<article class="item"><div class="meta">${escapeHtml(observation.id)} · ${escapeHtml(observation.focus)} · ${escapeHtml(observation.significance)} significance</div><p>${escapeHtml(observation.text)}</p><aside><strong>Evidence:</strong> ${escapeHtml(observation.evidence)}</aside></article>`).join("");
  const findingRows = assessment.findings.map(finding => `<article class="finding"><div class="meta">${escapeHtml(finding.id)} · ${escapeHtml(finding.confidence)} confidence · Linked inputs: ${escapeHtml(finding.inputs.join(", "))}</div><h3>${escapeHtml(finding.text)}</h3><p><strong>Candidate recommendation:</strong> ${escapeHtml(finding.recommendation)}</p></article>`).join("");
  reportRoot.innerHTML = `<header class="top"><div class="brand">${escapeHtml(appearance.organization || "HEIF")}</div><p class="label">Simulated assessment report</p><h1>${escapeHtml(assessment.discovery.establishment)}</h1><span class="status">${escapeHtml(assessment.status)} · Prototype example</span></header><section><h2>Assessment context</h2><table>${discoveryRows}</table></section><section><h2>Assessment focus</h2><table><thead><tr><th>Focus area</th><th>Client priority</th></tr></thead><tbody>${focusRows}</tbody></table></section><section><h2>Observations and evidence</h2>${observationRows}</section><section><h2>Draft findings and candidate recommendations</h2>${findingRows}</section><aside class="notice"><strong>Review notice:</strong> This report uses fictional prototype data. Findings and candidate recommendations are assessment support and require professional review.</aside>`;
}

document.querySelector("#system-print").addEventListener("click", () => window.print());
