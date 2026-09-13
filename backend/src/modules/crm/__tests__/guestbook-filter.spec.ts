// B1 backend — GuestbookService.list() with assignedToId filter.
// Powers the per-busdev filter on the Buku Tamu approval page.

import { GuestbookService } from "../guestbook/guestbook.service";

describe("GuestbookService.list — assignedToId filter (B1)", () => {
  let service: GuestbookService;
  const prismaMock: any = {
    guestbookEvent: { findMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GuestbookService(prismaMock);
  });

  it("filters by assignedToId via lead relation", async () => {
    prismaMock.guestbookEvent.findMany.mockResolvedValue([]);
    await service.list({ status: "PENDING", assignedToId: "u-busdev-1" });
    const arg = prismaMock.guestbookEvent.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({
      approvalStatus: "PENDING",
      lead: { assignedToId: "u-busdev-1" },
    });
  });

  it("omits assignedToId clause when not provided", async () => {
    prismaMock.guestbookEvent.findMany.mockResolvedValue([]);
    await service.list({ status: "PENDING" });
    const arg = prismaMock.guestbookEvent.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ approvalStatus: "PENDING" });
    expect(arg.where.lead).toBeUndefined();
  });

  it("returns empty where when no filters", async () => {
    prismaMock.guestbookEvent.findMany.mockResolvedValue([]);
    await service.list({});
    const arg = prismaMock.guestbookEvent.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({});
  });

  it("includes assignedToId in the lead select so UI can render", async () => {
    prismaMock.guestbookEvent.findMany.mockResolvedValue([]);
    await service.list({});
    const arg = prismaMock.guestbookEvent.findMany.mock.calls[0][0];
    expect(arg.include.lead.select).toEqual(expect.objectContaining({
      assignedToId: true,
    }));
  });
});