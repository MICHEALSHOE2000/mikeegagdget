// A model's generation and tier describe upgrade direction without relying on
// temporary selling prices, storage size or the condition of an individual unit.
export function deviceRank(phone) {
  if (!phone) return null;
  const slug = phone.slug || '';
  const brand = phone.brand;
  if (brand === 'Apple') {
    const generation = Number(slug.match(/^iphone-(\d+)(?=[a-z-]|$)/)?.[1]) ||
      ({'iphone-x':10,'iphone-xr':10,'iphone-xs':10,'iphone-xs-max':10,'iphone-se-2':11,'iphone-se-3':13}[slug]);
    if (!generation) return null;
    const tier = slug.includes('pro-max') ? 4 : slug.includes('-pro') ? 3 :
      slug.includes('-plus') || slug.includes('-air') || slug === 'iphone-xs-max' ? 2 :
      slug.includes('-se') || slug === 'iphone-xr' ? 0 : 1;
    return {family:'iphone', score:generation*5+tier};
  }
  if (brand === 'Samsung') {
    const generation = Number(slug.match(/^samsung-s(\d+)/)?.[1]);
    if (!generation) return null;
    return {family:'galaxy-s',score:generation*5+(slug.includes('ultra')?4:slug.includes('plus')?2:1)};
  }
  if (brand === 'Google') {
    const generation = Number(slug.match(/^(?:google-)?pixel-(\d+)/)?.[1]);
    if (!generation) return null;
    return {family:'pixel',score:generation*5+(slug.includes('pro-xl')?4:slug.includes('pro')?3:1)};
  }
  return null;
}

export function suitableCurrentPhone(current,target) {
  const from=deviceRank(current),to=deviceRank(target);
  // A different family or an unrecognized model needs an individual quote;
  // leave it reachable instead of silently ruling out legitimate trade-ins.
  if (!from || !to || from.family!==to.family) return true;
  return from.score<=to.score+5;
}
