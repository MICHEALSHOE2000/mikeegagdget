// Only advertise the recorded condition; age does not establish condition.
export function availableConditions(slug, recorded = []) {
  return [...new Set(recorded)];
}

export function selectedCondition(phone, requested) {
  const conditions = availableConditions(phone?.slug, phone?.conditions);
  return conditions.includes(requested) ? requested : conditions.length === 1 ? conditions[0] : 'Confirm available condition';
}
