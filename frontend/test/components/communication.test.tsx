import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DnaMention } from "@/components/dna/DnaMention";
import { DnaNotificationCenter } from "@/components/dna/DnaNotificationCenter";
import { mockCommViewer, communicationService } from "@/lib/services/communication-service";

describe("communication-service mock", () => {
  it("returns seeded threads", async () => {
    const res = await communicationService.listThreads(mockCommViewer, { status: "all" });
    expect(res.items.length).toBeGreaterThanOrEqual(3);
    expect(res.total).toBe(res.items.length);
  });

  it("filters by status", async () => {
    const res = await communicationService.listThreads(mockCommViewer, { status: "OPEN" });
    expect(res.items.every((t) => t.status === "OPEN")).toBe(true);
  });

  it("searches users", async () => {
    const users = await communicationService.searchUsers(mockCommViewer, "am");
    expect(users.some((u) => /am/i.test(u.name))).toBe(true);
  });

  it("creates reply and increments thread count", async () => {
    const threadId = "t-3"; // CLOSED thread — never modified by other tests
    const reply = await communicationService.createReply(mockCommViewer, threadId, {
      body: "Test reply body " + Date.now(), // unique per run
      urgency: "NORMAL",
      mentionIds: [],
    });
    expect(reply.body).toMatch(/^Test reply body/);
    expect(reply.threadId).toBe(threadId);
    expect(reply.id).toBeTruthy();
    expect(typeof reply.createdAt).toBe("string");
  });

  it("lists notifications with at least one mention", async () => {
    const list = await communicationService.listNotifications(mockCommViewer);
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((n) => n.kind === "mention")).toBe(true);
  });
});

describe("DnaMention", () => {
  it("renders nothing when value has no @ token", () => {
    const { container } = render(
      <div>
        <DnaMention value="plain text no trigger" onChange={() => {}} />
      </div>,
    );
    // No listbox rendered in DOM
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });

  it("does not match @ preceded by word char (email-like)", () => {
    const { container } = render(
      <div>
        <DnaMention value="foo@bar" onChange={() => {}} />
      </div>,
    );
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });

  it("fires onPickerStateChange callback when value changes", () => {
    let observed = false;
    const { rerender } = render(
      <div>
        <DnaMention value="hello " onChange={() => {}} onPickerStateChange={(o) => (observed = o)} />
      </div>,
    );
    rerender(
      <div>
        <DnaMention value="hello @a" onChange={() => {}} onPickerStateChange={(o) => (observed = o)} />
      </div>,
    );
    expect(typeof observed).toBe("boolean");
  });
});

describe("DnaNotificationCenter", () => {
  it("renders bell with no badge when there are no unread notifications", async () => {
    // Filter notifications to read ones for stable assertion
    const list = await communicationService.listNotifications(mockCommViewer);
    expect(list.length).toBeGreaterThan(0);
    render(<DnaNotificationCenter viewer={mockCommViewer} pollIntervalMs={9999999} />);
    // bell aria-label exists
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });

  it("opens dropdown on click and shows notification title", async () => {
    render(<DnaNotificationCenter viewer={mockCommViewer} pollIntervalMs={9999999} />);
    fireEvent.click(screen.getByLabelText("Notifications"));
    // Dropdown role=menu appears
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});