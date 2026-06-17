export function maskPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d+]/g, '');
  const last4 = cleaned.slice(-4);
  const prefix = cleaned.startsWith('+') ? '+' : '';
  return `${prefix}**${last4}`;
}
