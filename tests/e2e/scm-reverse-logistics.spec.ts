import { test, expect } from "@playwright/test";
import { loginAsScm, getScmToken, authHeader } from "../fixtures/scm-auth";

const TEST_PREFIX = `E2E-RET-${Date.now()}`;

test.describe("SCM Reverse Logistics: Purchase Returns", () => {
  let token: string;
  let supplierId: string;
  let materialId: string;
  let warehouseId: string;
  let createdReturn: any;

  test.beforeAll(async ({ request }) => {
    token = await getScmToken(request);

    const [supRes, matRes, whRes] = await Promise.all([
      request.get("/api/master/suppliers", { headers: authHeader(token) }),
      request.get("/api/scm/materials", { headers: authHeader(token) }),
      request.get("/api/master/warehouses/active", {
        headers: authHeader(token),
      }),
    ]);

    const supBody = await supRes.json();
    const matBody = await matRes.json();
    const whBody = await whRes.json();

    supplierId =
      (Array.isArray(supBody) ? supBody : supBody.data || []).find(
        (s: any) => s.name?.includes("Global") || s.name?.includes("Chemical"),
      )?.id ?? (Array.isArray(supBody) ? supBody[0] : supBody.data?.[0])?.id;
    materialId = (Array.isArray(matBody) ? matBody : matBody.data || [])[0]?.id;
    warehouseId = (Array.isArray(whBody) ? whBody : whBody.data || [])[0]?.id;
  });

  test("B-01: Create Purchase Return via API", async ({ request }) => {
    test.skip(
      !supplierId || !materialId || !warehouseId,
      "No reference data available",
    );

    const res = await request.post("/api/scm/purchase-returns", {
      data: {
        supplierId,
        warehouseId,
        notes: `E2E Return ${TEST_PREFIX}`,
        items: [{ materialId, quantity: 10, unitPrice: 15000 }],
      },
      headers: authHeader(token),
    });
    expect(res.status()).toBe(201);
    createdReturn = await res.json();

    expect(createdReturn.returnNumber).toContain("RET-PUR");
    expect(createdReturn.status).toBe("DRAFT");
    expect(createdReturn.items).toBeDefined();
    expect(createdReturn.items.length).toBe(1);
  });

  test("B-02: List Returns shows created return", async ({ request }) => {
    test.skip(!createdReturn, "Return not created");

    const res = await request.get("/api/scm/purchase-returns", {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const returns = Array.isArray(body) ? body : body.data || [];
    const ourReturn = returns.find((r: any) => r.id === createdReturn.id);
    expect(ourReturn).toBeDefined();
    expect(ourReturn.status).toBe("DRAFT");
  });

  test("B-03: Complete Return via API + verify via UI", async ({
    page,
    request,
  }) => {
    test.skip(!createdReturn, "Return not created");

    const updateRes = await request.patch(
      `/api/scm/purchase-returns/${createdReturn.id}/status`,
      {
        data: { status: "COMPLETED" },
        headers: authHeader(token),
      },
    );
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.status).toBe("COMPLETED");

    await loginAsScm(page);
    await page.goto("/scm/purchase-returns");
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator(`text=${createdReturn.returnNumber}`).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("B-04: Audit trail — createdBy user is recorded", async ({
    request,
  }) => {
    test.skip(!createdReturn, "Return not created");

    const getRes = await request.get(
      `/api/scm/purchase-returns/${createdReturn.id}`,
      {
        headers: authHeader(token),
      },
    );
    expect(getRes.status()).toBe(200);
    const ret = await getRes.json();

    expect(
      ret.createdById || ret.createdBy?.id || ret.creator?.id,
    ).toBeDefined();
  });
});
