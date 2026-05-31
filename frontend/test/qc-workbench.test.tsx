import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DefectDetailModal from "@/components/qc/DefectDetailModal";
import QcSignatureModal from "@/components/qc/QcSignatureModal";
import QcNumpad from "@/components/qc/QcNumpad";

// ── DefectDetailModal ─────────────────────────────────────────────

describe("DefectDetailModal", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders all defect form fields", () => {
    render(<DefectDetailModal {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: "Defect Detail" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Non-Conformance Report/)).toBeInTheDocument();

    expect(screen.getByText("Defect Category *")).toBeInTheDocument();
    expect(screen.getByText("Defect Type *")).toBeInTheDocument();
    expect(screen.getByText("Severity *")).toBeInTheDocument();
    expect(screen.getByText("Disposition *")).toBeInTheDocument();

    expect(screen.getByText("Minor")).toBeInTheDocument();
    expect(screen.getByText("Major")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();

    expect(screen.getByText("Root Cause Analysis")).toBeInTheDocument();
    expect(screen.getByText("Corrective Action")).toBeInTheDocument();

    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Submit NCR")).toBeInTheDocument();
  });

  it("disables submit when required fields empty", () => {
    render(<DefectDetailModal {...defaultProps} />);

    const submitBtn = screen.getByRole("button", { name: /Submit NCR/i });
    expect(submitBtn).toBeDisabled();
  });

  it.skip("remains disabled until all required fields filled", async () => {
    const user = userEvent.setup();
    render(<DefectDetailModal {...defaultProps} />);

    const submitBtn = screen.getByRole("button", { name: /Submit NCR/i });

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Crack/i), {
      target: { value: "Crack" },
    });
    expect(submitBtn).toBeDisabled();

    await user.click(screen.getByText("Major"));
    expect(submitBtn).toBeDisabled();

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    await user.click(screen.getByText("FISIK"));
    expect(submitBtn).toBeDisabled();

    await user.click(comboboxes[1]);
    await user.click(screen.getByText("REWORK"));

    expect(submitBtn).not.toBeDisabled();
  });

  it("calls onClose when Cancel clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<DefectDetailModal {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit with form data", async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <DefectDetailModal open={true} onClose={onClose} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Crack/i), {
      target: { value: "Crack" },
    });
    await user.click(screen.getByText("Major"));

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    await user.click(screen.getByText("FISIK"));

    await user.click(comboboxes[1]);
    await user.click(screen.getByText("REWORK"));

    await user.click(screen.getByRole("button", { name: /Submit NCR/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      defectCategory: "FISIK",
      defectType: "Crack",
      defectLocation: "",
      severity: "MAJOR",
      disposition: "REWORK",
      defectCause: "",
      correctiveAction: "",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <DefectDetailModal {...defaultProps} open={false} />,
    );
    expect(container.textContent).not.toContain("Defect Detail");
  });
});

// ── QcSignatureModal ───────────────────────────────────────────────

describe("QcSignatureModal", () => {
  const mockParams = [
    { label: "pH", value: "6.5", range: "5.5-6.5", status: "PASS" as const },
    {
      label: "Kadar Air",
      value: "3.2",
      range: "2.0-4.0",
      status: "FAIL" as const,
    },
  ];

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSign: vi.fn(),
    batchId: "BATCH-001",
    stage: "MIXING" as const,
    parameters: mockParams,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders parameter summary and PIN input", () => {
    render(<QcSignatureModal {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: "QC Sign-Off" }),
    ).toBeInTheDocument();
    expect(screen.getByText("BATCH-001")).toBeInTheDocument();
    expect(screen.getByText("MIXING")).toBeInTheDocument();

    expect(screen.getByText("pH")).toBeInTheDocument();
    expect(screen.getByText("6.5")).toBeInTheDocument();
    expect(screen.getByText("Target: 5.5-6.5")).toBeInTheDocument();
    expect(screen.getByText("Kadar Air")).toBeInTheDocument();
    expect(screen.getByText("3.2")).toBeInTheDocument();
    expect(screen.getByText("Target: 2.0-4.0")).toBeInTheDocument();

    expect(screen.getByText("PASS")).toBeInTheDocument();
    expect(screen.getAllByText("FAIL")).toHaveLength(1);

    expect(
      screen.getByText(/One or more parameters have FAILED/),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/6-Digit Secure PIN Confirmation/),
    ).toBeInTheDocument();

    expect(screen.getByText("Abort Protocol")).toBeInTheDocument();
    expect(screen.getByText("Tanda Tangani & Setujui")).toBeInTheDocument();
  });

  it("disables sign button until PIN is 6 digits", () => {
    const { container } = render(<QcSignatureModal {...defaultProps} />);

    const signBtn = screen.getByRole("button", { name: /Tanda Tangani/i });
    expect(signBtn).toBeDisabled();

    const pinInput = container.querySelector('input[type="password"]')!;
    expect(pinInput).toBeInTheDocument();

    fireEvent.change(pinInput, { target: { value: "123" } });
    expect(signBtn).toBeDisabled();

    fireEvent.change(pinInput, { target: { value: "123456" } });
    expect(signBtn).not.toBeDisabled();
  });

  it("calls onSign with pin and notes on confirm", async () => {
    const onSign = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <QcSignatureModal
        {...defaultProps}
        onSign={onSign}
        onClose={onClose}
      />,
    );

    const pinInput = container.querySelector('input[type="password"]')!;
    await user.type(pinInput, "123456");

    const notesInput = screen.getByPlaceholderText(/additional observations/i);
    await user.type(notesInput, "All parameters verified");

    await user.click(screen.getByRole("button", { name: /Tanda Tangani/i }));
    expect(onSign).toHaveBeenCalledTimes(1);
    expect(onSign).toHaveBeenCalledWith({
      pin: "123456",
      notes: "All parameters verified",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Abort Protocol clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<QcSignatureModal {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByText("Abort Protocol"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── QcNumpad ────────────────────────────────────────────────────────

describe("QcNumpad", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    label: "pH Value",
    unit: "pH",
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders label and unit", () => {
    render(<QcNumpad {...defaultProps} />);

    expect(screen.getByText("pH Value")).toBeInTheDocument();
    expect(screen.getByText("pH")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText(/clear/i)).toBeInTheDocument();
  });

  it("displays entered digits", async () => {
    const user = userEvent.setup();
    render(<QcNumpad {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "3" }));

    expect(screen.getByText("123")).toBeInTheDocument();
  });

  it("clears on clear button", async () => {
    const user = userEvent.setup();
    render(<QcNumpad {...defaultProps} />);

    const confirmBtn = screen.getByText("Confirm").closest("button")!;
    expect(confirmBtn).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    expect(confirmBtn).not.toBeDisabled();

    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(confirmBtn).toBeDisabled();
  });

  it("handles decimal point", async () => {
    const user = userEvent.setup();
    render(<QcNumpad {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "." }));
    await user.click(screen.getByRole("button", { name: "5" }));

    expect(screen.getByText("1.5")).toBeInTheDocument();
  });

  it("calls onConfirm with parsed numeric value", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <QcNumpad
        {...defaultProps}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByText("Confirm"));

    expect(onConfirm).toHaveBeenCalledWith(42);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Cancel clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<QcNumpad {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("preserves currentValue when opened", () => {
    render(
      <QcNumpad
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        label="pH Value"
        unit="pH"
        currentValue={7.5}
      />,
    );

    expect(screen.getByText("7.5")).toBeInTheDocument();
  });

  it("initializes display to 0 when no currentValue", () => {
    const { container } = render(<QcNumpad {...defaultProps} />);

    const displayNumbers = container.querySelectorAll(
      'span:not([class*="sr-only"])',
    );
    const displayTexts = Array.from(displayNumbers).map((el) => el.textContent);
    expect(displayTexts.some((t) => t === "0")).toBe(true);
  });
});
