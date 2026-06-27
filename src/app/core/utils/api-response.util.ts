export function unwrapArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object' && '$values' in data) {
    return (data as { $values: T[] }).$values ?? [];
  }

  return [];
}
