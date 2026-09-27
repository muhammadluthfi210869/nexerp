// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unwrapResponse<T = any>(response: any): T {
  if (response?.data?.data) return response.data.data;
  if (response?.data) return response.data;
  return response;
}
