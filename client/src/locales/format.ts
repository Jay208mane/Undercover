export function formatMessage(
  message: string,
  values: Record<string, string | number>
): string {
  return message.replace(/\{(\w+)\}/g, (match, key: string) =>
    values[key] === undefined ? match : String(values[key])
  );
}
