import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn((options) => options),
  useMutation: vi.fn((options) => options),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));
vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

import { api } from "@/lib/api";
import {
  useCanonicalSocialPosts,
  useCreateMarketingTask,
  useMarketingTasks,
  useSocialStatusMutation,
  useTaskStatusMutation,
} from "./useCanonicalMarketing";

describe("canonical marketing hooks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("serializes task filters to the canonical list endpoint", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [], page: 2, limit: 25, total: 0, hasMore: false } } as any);
    const query = useMarketingTasks({ page: 2, limit: 25, q: "launch", status: "IN_REVIEW", brandId: "brand-1" }) as any;
    await query.queryFn();
    expect(api.get).toHaveBeenCalledWith("/marketing/tasks?page=2&limit=25&q=launch&status=IN_REVIEW&brandId=brand-1");
    expect(query.queryKey).toEqual(["marketing", "tasks", expect.objectContaining({ status: "IN_REVIEW" })]);
  });

  it("sends a unique persistent idempotency key on task creation", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: "task-1" } } as any);
    const mutation = useCreateMarketingTask() as any;
    await mutation.mutationFn({ title: "Launch", type: "DAILY" });
    expect(api.post).toHaveBeenCalledWith(
      "/marketing/tasks",
      expect.objectContaining({ title: "Launch" }),
      { headers: { "Idempotency-Key": expect.stringMatching(/^[0-9a-f-]{36}$/) } },
    );
  });

  it("always carries version in task workflow mutations", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { id: "task-1", version: 8 } } as any);
    const mutation = useTaskStatusMutation() as any;
    await mutation.mutationFn({ id: "task-1", version: 7, status: "IN_REVIEW" });
    expect(api.patch).toHaveBeenCalledWith("/marketing/tasks/task-1/status", {
      version: 7,
      status: "IN_REVIEW",
      reason: undefined,
    });
  });

  it("normalizes the compatibility posts alias without sample fallback", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { posts: [{ id: "p1", status: "IDEA" }], page: 1, limit: 25, total: 1 } } as any);
    const query = useCanonicalSocialPosts({ page: 1, limit: 25 }) as any;
    const result = await query.queryFn();
    expect(result.data).toEqual([{ id: "p1", status: "IDEA" }]);
  });

  it("uses canonical uppercase status and optimistic version for social workflow", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { post: { id: "p1", status: "DRAFT", version: 2 } } } as any);
    const mutation = useSocialStatusMutation() as any;
    await mutation.mutationFn({ post: { id: "p1", version: 1 }, status: "DRAFT" });
    expect(api.patch).toHaveBeenCalledWith("/marketing/social/posts/p1", { version: 1, status: "DRAFT" });
  });
});
