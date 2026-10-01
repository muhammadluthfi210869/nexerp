// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unwrapResponse<T = any>(response: any): T {
  if (!response) return response;
  const payload = response.data !== undefined ? response.data : response;
  if (!payload || typeof payload !== "object") return payload;

  // Preserve envelope if payload contains data AND pagination metadata (total, limit, page, etc.)
  if (
    payload.data !== undefined &&
    (payload.total !== undefined ||
      payload.totalPages !== undefined ||
      payload.pagination !== undefined ||
      payload.meta !== undefined)
  ) {
    return payload;
  }

  // If payload is simply nested { data: T } with no pagination metadata, unwrap the inner data
  if (payload.data !== undefined) {
    return payload.data;
  }

  return payload;
}
