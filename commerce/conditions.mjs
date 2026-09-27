// Only advertise condition choices actually recorded for the model. Older
// iPhones are sold as UK Used, regardless of legacy catalogue labels.
export function availableConditions(slug, recorded = []) {
  const series = Number(slug?.match(/^iphone-(\d+)(?:-|$)/)?.[1]);
  if (slug?.startsWith('iphone-') && (!series || series <= 15)) return ['UK Used'];
  return [...new Set(recorded)];
}

export function selectedCondition(phone, requested) {
  const conditions = availableConditions(phone?.slug, phone?.conditions);
  return conditions.includes(requested) ? requested : conditions.length === 1 ? conditions[0] : 'Confirm available condition';
}
