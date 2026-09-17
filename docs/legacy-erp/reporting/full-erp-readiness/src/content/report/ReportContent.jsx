import React from "react";

import {
  DataComponent,
  DataTable,
  MetricCard,
  ReportSection,
  RichNarrative,
  useDataApp,
} from "../../data-app-public.jsx";

const alignmentColumns = [
  { key: "layer", label: "Layer" },
  { key: "canonical", label: "Canonical", align: "right" },
  { key: "implementation", label: "Implementation", align: "right" },
  { key: "exactShared", label: "Exact shared", align: "right" },
  { key: "exactCoverage", label: "Exact coverage", presentation: "percent", align: "right",
    format: (value) => `${Number(value).toFixed(1)}%` },
];

const gateColumns = [
  { key: "gate", label: "Gate" },
  { key: "result", label: "Result", presentation: "status" },
  { key: "detail", label: "Observed evidence" },
];

const phaseColumns = [
  { key: "phase", label: "Phase" },
  { key: "group", label: "Group", presentation: "status" },
  { key: "name", label: "Required outcome" },
];

export function ReportContent() {
  const { snapshot, visible, canEdit, mode, appTitle, setAppTitle } = useDataApp();
  const readiness = snapshot.queries.readiness_dimensions.rows;
  const alignment = snapshot.queries.exact_alignment.rows;
  const gates = snapshot.queries.observed_gates.rows;
  const phases = snapshot.queries.phase_plan.rows;

  return <article className="report-content" aria-label="NEX ERP production-readiness report">
    <header className="report-hero">
      <p className="report-kicker">Full ERP production-readiness assessment · 17 September 2026</p>
      <h1 data-data-app-title contentEditable={canEdit && mode === "edit"} suppressContentEditableWarning
        aria-label={canEdit && mode === "edit" ? "Edit report heading" : undefined}
        onBlur={canEdit && mode === "edit" ? (event) => setAppTitle(event.currentTarget.textContent.trim() || appTitle) : undefined}
        onKeyDown={canEdit && mode === "edit" ? (event) => {
          if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
        } : undefined}>{appTitle}</h1>
      <RichNarrative id="report:description" className="report-deck" label="Edit report introduction"
        value="This is a conservative **release-evidence** assessment, not a guess at how much code exists. The repository contains substantial ERP implementation, but it cannot enter UAT until contracts, code, data, security, UI, and operations pass the same gated system." />
    </header>

    {visible("executive-summary") && <ReportSection id="executive-summary" title="Executive summary"
      queryId="readiness_dimensions" queryIds={["readiness_dimensions", "exact_alignment", "observed_gates"]}
      sourceRowsByQuery={{ readiness_dimensions: readiness, exact_alignment: alignment, observed_gates: gates }}
      showHeading={false}>
      <RichNarrative id="executive-summary:body" className="report-summary-lead" label="Edit executive summary"
        value={`## The verified readiness baseline is 14.0%; the remaining gap is 86.0%

- The SSOT is close to internally consistent at **18/19 gates (94.7%)**, but four implementation-changing decisions remain.
- Exact contract-to-code identity is only **22.8% for models, 3.4% for APIs, and 3.9% for screen routes**. Mismatches must be classified before they can be called missing or complete.
- The release baseline is red: frontend build, backend/frontend tests, lint, Compose environment parsing, and production dependency audits currently fail.
- The path to UAT is a **23-phase strict gate**, from security containment through full-domain delivery, polished UI, migration/DR rehearsal, and independent pre-UAT certification.`} />
    </ReportSection>}

    <div className="report-facts" aria-label="Key readiness facts">
      <MetricCard id="readiness-summary" title="Verified readiness" queryId="readiness_dimensions"
        sourceRows={readiness} value="14.0%" description="Weighted evidence already proven against release gates." />
      <MetricCard id="remaining-gap" title="Remaining gap" queryId="readiness_dimensions"
        sourceRows={readiness} value="86.0%" negative description="Work still requiring verified production evidence." />
      <MetricCard id="phase-count" title="Strict phases" queryId="phase_plan"
        sourceRows={phases} value="23" description="P00–P22; a failed phase is remediated and retested in place." />
      <MetricCard id="decision-count" title="Business blockers" queryId="observed_gates"
        sourceRows={gates} value="4" negative description="Material choices that cannot be inferred safely." />
    </div>

    {visible("alignment-table") && <section className="report-section">
      <ReportSection id="alignment-narrative" title="Contract alignment is the largest measurable uncertainty"
        queryId="exact_alignment" sourceRows={alignment} showHeading={false}>
        <RichNarrative id="alignment-narrative:body" className="report-analysis" label="Edit alignment interpretation"
          value="## Contract alignment is the largest measurable uncertainty\n\nThe implementation contains more models, endpoints, and pages than the canonical set, yet very few identities match exactly. This can represent aliases, parallel legacy paths, extensions, or missing canonical work. Phase P02 must classify every mismatch; these percentages must not be presented as feature-completeness percentages." />
      </ReportSection>
      <DataComponent id="alignment-table" title="Exact canonical-to-implementation identity" queryId="exact_alignment"
        kind="table" sourceRows={alignment} description="Strict normalized identity; semantic equivalence is not inferred.">
        <DataTable rows={alignment} columns={alignmentColumns} searchable={false} caption="Exact identity alignment by contract layer" />
      </DataComponent>
    </section>}

    {visible("gate-table") && <section className="report-section">
      <ReportSection id="gate-narrative" title="Current release gates are red" queryId="observed_gates"
        sourceRows={gates} showHeading={false}>
        <RichNarrative id="gate-narrative:body" className="report-analysis" label="Edit gate interpretation"
          value="## Current release gates are red\n\nPassing files and individual assertions are useful progress, but release gates are binary. A suite with failures, worker errors, skipped critical tests, or an environment that cannot boot remains failed. P00–P03 stabilize security, environment, truth, and CI before further domain certification." />
      </ReportSection>
      <DataComponent id="gate-table" title="Observed execution evidence" queryId="observed_gates"
        kind="table" sourceRows={gates} description="Commands executed against the local workspace on 17 September 2026.">
        <DataTable rows={gates} columns={gateColumns} searchable={false} caption="Current build test and security gate results" />
      </DataComponent>
    </section>}

    {visible("phase-table") && <section className="report-section">
      <ReportSection id="phase-narrative" title="The roadmap ends at a technically certified UAT candidate"
        queryId="phase_plan" sourceRows={phases} showHeading={false}>
        <RichNarrative id="phase-narrative:body" className="report-analysis" label="Edit roadmap interpretation"
          value="## The roadmap ends at a technically certified UAT candidate\n\nWork inside a phase may run in parallel, but certification is sequential. Failure returns the same phase to remediation and retest. P22 may issue **READY FOR UAT** only after the full clean-room suite, two repeatable migration rehearsals, UI/accessibility review, security/performance thresholds, and operational recovery evidence pass." />
      </ReportSection>
      <DataComponent id="phase-table" title="P00–P22 phase sequence" queryId="phase_plan"
        kind="table" sourceRows={phases} description="Detailed entry, exit, and test gates are in the repository roadmap and YAML registry.">
        <DataTable rows={phases} columns={phaseColumns} searchable caption="Full ERP production-readiness phases" />
      </DataComponent>
    </section>}

    <ReportSection id="method-note" title="How to interpret the 14.0% score" queryId="readiness_dimensions"
      sourceRows={readiness} showHeading={false}>
      <RichNarrative id="method-note:body" className="report-disclosure" label="Edit methodology note"
        value="## How to interpret the 14.0% score\n\nThe score gives no release credit to an unverified domain, even when code exists. That makes it deliberately conservative and prevents file volume from masquerading as production readiness. It should be replaced with a defensible feature-completion measure only after P02 establishes complete canonical mappings and P03 makes the evidence repeatable." />
    </ReportSection>
  </article>;
}
