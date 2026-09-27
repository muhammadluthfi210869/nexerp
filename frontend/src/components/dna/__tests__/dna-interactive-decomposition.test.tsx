import { describe, it, expect } from "vitest";
import * as DnaBarrel from "@/components/dna";
import * as DnaInteractiveElements from "@/components/dna/DnaInteractiveElements";
import * as DnaInteractiveFolder from "@/components/dna/dna-interactive";
import * as DnaInputs from "@/components/dna/dna-interactive/inputs";
import * as DnaModals from "@/components/dna/dna-interactive/modals";
import * as DnaResultPrint from "@/components/dna/dna-interactive/result-print";
import * as DnaWorkflow from "@/components/dna/dna-interactive/workflow";
import * as DnaToast from "@/components/dna/dna-interactive/toast";
import * as DnaLayout from "@/components/dna/dna-interactive/layout";

describe("Fase 4 (Slice 4.1) — DNA Interactive Elements Decomposition", () => {
  const EXPECTED_COMPONENTS = [
    // Inputs
    "DnaCurrencyInput",
    "DnaNumberInput",
    "DnaPercentageInput",
    "DnaDatePicker",
    "DnaSearchableSelect",
    "DnaSwitch",
    // Modals
    "DnaCrudModal",
    "DnaConfirmDialog",
    "DnaVoidDialog",
    // Result & Print
    "DnaResultModal",
    "DnaPrintModal",
    "DnaPrintItem",
    "DnaPrintSignature",
    "DnaExportButton",
    // Workflow
    "DnaLineItemsTable",
    "DnaWorkflowBar",
    // Layout
    "DnaFormSection",
    "DnaCascadingAddress",
    "DnaInfoCard",
    "DnaRadioGroup",
    "DnaStickyFooter",
  ] as const;

  it("exports all 21 key interactive components through the @/components/dna barrel", () => {
    for (const name of EXPECTED_COMPONENTS) {
      expect(DnaBarrel[name as keyof typeof DnaBarrel]).toBeDefined();
    }
  });

  it("exports all components through the DnaInteractiveElements facade", () => {
    for (const name of EXPECTED_COMPONENTS) {
      expect(DnaInteractiveElements[name as keyof typeof DnaInteractiveElements]).toBeDefined();
    }
    expect(DnaInteractiveElements.useDnaToast).toBeDefined();
    expect(DnaInteractiveElements.DnaToastProvider).toBeDefined();
    expect(DnaInteractiveElements.DnaCard).toBeDefined();
  });

  it("exports all components through dna-interactive barrel", () => {
    for (const name of EXPECTED_COMPONENTS) {
      expect(DnaInteractiveFolder[name as keyof typeof DnaInteractiveFolder]).toBeDefined();
    }
  });

  it("inputs module exports input components", () => {
    expect(DnaInputs.DnaCurrencyInput).toBeDefined();
    expect(DnaInputs.DnaNumberInput).toBeDefined();
    expect(DnaInputs.DnaPercentageInput).toBeDefined();
    expect(DnaInputs.DnaDatePicker).toBeDefined();
    expect(DnaInputs.DnaSearchableSelect).toBeDefined();
    expect(DnaInputs.DnaSwitch).toBeDefined();
  });

  it("modals module exports modal components", () => {
    expect(DnaModals.DnaCrudModal).toBeDefined();
    expect(DnaModals.DnaConfirmDialog).toBeDefined();
    expect(DnaModals.DnaVoidDialog).toBeDefined();
  });

  it("result-print module exports print & export components", () => {
    expect(DnaResultPrint.DnaResultModal).toBeDefined();
    expect(DnaResultPrint.DnaPrintModal).toBeDefined();
    expect(DnaResultPrint.DnaPrintItem).toBeDefined();
    expect(DnaResultPrint.DnaPrintSignature).toBeDefined();
    expect(DnaResultPrint.DnaExportButton).toBeDefined();
  });

  it("workflow module exports line items table and workflow bar", () => {
    expect(DnaWorkflow.DnaLineItemsTable).toBeDefined();
    expect(DnaWorkflow.DnaWorkflowBar).toBeDefined();
  });

  it("toast module exports hook and provider", () => {
    expect(DnaToast.useDnaToast).toBeDefined();
    expect(DnaToast.DnaToastProvider).toBeDefined();
  });

  it("layout module exports section, address, info card, and sticky footer", () => {
    expect(DnaLayout.DnaFormSection).toBeDefined();
    expect(DnaLayout.DnaCascadingAddress).toBeDefined();
    expect(DnaLayout.DnaInfoCard).toBeDefined();
    expect(DnaLayout.DnaRadioGroup).toBeDefined();
    expect(DnaLayout.DnaStickyFooter).toBeDefined();
    expect(DnaLayout.DnaCard).toBeDefined();
  });
});
