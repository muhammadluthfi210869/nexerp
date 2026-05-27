export function unwrapResponse<T>(response: any): T {
  if (response?.data?.data) return response.data.data as T;
  if (response?.data) return response.data as T;
  return response as T;
}
