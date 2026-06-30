export function getCounterColor(length: number, maxChars: number = 280): string {
  if (length >= maxChars) return 'error';
  if (length >= maxChars - 20) return 'warning';
  return 'primary';
}
