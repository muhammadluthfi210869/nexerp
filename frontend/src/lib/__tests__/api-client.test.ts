import { describe, it, expect, vi } from "vitest";
import { unwrapData, apiClient, createApiQueryHook } from "../api-client";
import { api } from "../api";

vi.mock("../api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/hooks/useApiQuery", () => ({
  useApiQuery: vi.fn((key, fn, opts) => ({ key, fn, opts })),
}));

describe("api-client", () => {
  describe("unwrapData", () => {
    it("unwraps object with data property", () => {
      const wrapped = { data: [{ id: 1, name: "Test" }], message: "Success" };
      expect(unwrapData(wrapped)).toEqual([{ id: 1, name: "Test" }]);
    });

    it("returns raw payload if no data property exists", () => {
      const raw = [{ id: 2, name: "Raw" }];
      expect(unwrapData(raw)).toEqual(raw);
    });

    it("handles primitives and null safely", () => {
      expect(unwrapData(null)).toBeNull();
      expect(unwrapData(undefined)).toBeUndefined();
      expect(unwrapData("string")).toBe("string");
      expect(unwrapData(123)).toBe(123);
    });
  });

  describe("apiClient HTTP methods", () => {
    it("calls api.get and unwraps res.data", async () => {
      const mockData = { id: 1, title: "Order" };
      (api.get as any).mockResolvedValueOnce({ data: mockData });

      const res = await apiClient.get<typeof mockData>("/test", { status: "ACTIVE" });
      expect(api.get).toHaveBeenCalledWith("/test", { params: { status: "ACTIVE" } });
      expect(res).toEqual(mockData);
    });

    it("calls api.post and unwraps res.data", async () => {
      const payload = { title: "New" };
      const mockData = { id: 2, ...payload };
      (api.post as any).mockResolvedValueOnce({ data: mockData });

      const res = await apiClient.post<typeof mockData>("/test", payload);
      expect(api.post).toHaveBeenCalledWith("/test", payload);
      expect(res).toEqual(mockData);
    });

    it("calls api.patch and unwraps res.data", async () => {
      const patchData = { status: "CLOSED" };
      (api.patch as any).mockResolvedValueOnce({ data: { id: 1, ...patchData } });

      const res = await apiClient.patch("/test/1", patchData);
      expect(api.patch).toHaveBeenCalledWith("/test/1", patchData);
      expect(res).toEqual({ id: 1, status: "CLOSED" });
    });

    it("calls api.put and unwraps res.data", async () => {
      const putData = { id: 1, status: "UPDATED" };
      (api.put as any).mockResolvedValueOnce({ data: putData });

      const res = await apiClient.put("/test/1", putData);
      expect(api.put).toHaveBeenCalledWith("/test/1", putData);
      expect(res).toEqual(putData);
    });

    it("calls api.delete and unwraps res.data", async () => {
      (api.delete as any).mockResolvedValueOnce({ data: { success: true } });

      const res = await apiClient.delete("/test/1");
      expect(api.delete).toHaveBeenCalledWith("/test/1");
      expect(res).toEqual({ success: true });
    });
  });

  describe("createApiQueryHook", () => {
    it("constructs queryKey correctly with and without params", () => {
      const fetcher = vi.fn();
      const useTestQuery = createApiQueryHook<{ id: number }, { id: number }>(["orders"], fetcher);

      const resultWithParams = useTestQuery({ id: 123 });
      expect((resultWithParams as any).key).toEqual(["orders", JSON.stringify({ id: 123 })]);

      const useNoParamQuery = createApiQueryHook<{ count: number }>(["summary"], fetcher as any);
      const resultNoParams = (useNoParamQuery as any)();
      expect((resultNoParams as any).key).toEqual(["summary"]);
    });
  });
});
