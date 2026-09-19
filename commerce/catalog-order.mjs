// Shared by the home catalogue, search, model pages, deals and buy/swap pickers.
export function newestFirst(a, b) {
  const rank = p => {
    const name=p.model || p.label || '';
    const generation=Number(name.match(/(?:iPhone |Galaxy S|Pixel )(\d+)/i)?.[1] || (/XS/.test(name)?10.3:/XR/.test(name)?10.2:/iPhone X/.test(name)?10:/SE/.test(name)?8.5:0));
    const tier=/Pro Max|Ultra|Pro XL/.test(name)?6:/Pro/.test(name)?5:/Plus|\+/.test(name)?4:/Air/.test(name)?2:3;
    return generation*10+tier + (/iPhone 6s/.test(name)?5:0) + (/XS Max/.test(name)?1:0);
  };
  const brandRank={Apple:0,Samsung:1,Google:2};
  return (brandRank[a.brand]??3)-(brandRank[b.brand]??3) || rank(b)-rank(a);
}
