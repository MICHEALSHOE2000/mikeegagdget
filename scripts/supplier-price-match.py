import csv,json,re,collections,sys
cat=json.load(open('assets/store-catalog.json'))
items={it['slug']:it for it in cat}
def cap(storage): return re.split(r'\s*·\s*',storage)[0]
def slug_for(category,model):
    m=model.strip()
    if category=='Google Pixel':
        m=re.sub(r'\s+A$','a',m)            # "Pixel 10 A" -> "Pixel 10a"
        return re.sub(r'\s+','-',m.lower())
    if category=='Samsung':
        m=m.replace('+',' plus')
        m=re.sub(r'^Fold (\d)',r'Z Fold \1',m)
        return 'samsung-'+re.sub(r'\s+','-',m.lower())
    return None
rows=list(csv.DictReader(open('/home/claude/prices/supplier.csv',encoding='utf-8')))
out=collections.defaultdict(list); used=set()
for r in rows:
    catg,model,storage,cond,sim=r['Category'],r['Model'],r['Storage'],r['Condition'],r['SIM']
    hi=r['Highest quote (NGN)'].strip()
    rec={'category':catg,'model':model,'storage':storage,'condition':cond,'sim':sim,'highest':int(hi) if hi.isdigit() else None,'quotes':r['Source prices'],'supplier_count':r['Supplier count']}
    if catg not in ('Google Pixel','Samsung'):
        rec['reason']='Excluded this phase: '+('laptops/computers' if catg!='iPhone' else 'iPhone row from a laptop supplier with storage "See model"'); out['excluded'].append(rec); continue
    if not re.fullmatch(r'\d+(GB|TB)',storage) or rec['highest'] is None:
        rec['reason']='Storage or price unclear (storage: %s)'%storage; out['ambiguous'].append(rec); continue
    slug=slug_for(catg,model); rec['slug']=slug
    esim=sim.startswith('eSIM')
    if slug not in items:
        rec['reason']='Model not in catalogue'; out['new_model'].append(rec); continue
    it=items[slug]
    cands=[v for v in it['variants'] if cap(v['storage'])==storage]
    vcond=lambda v:(v.get('condition') or (it.get('conditions') or [''])[0])
    same=[v for v in cands if vcond(v)==cond and not esim]
    confirm=[v for v in cands if vcond(v)=='Confirm condition' and not esim]
    if len(same)==1 or (not same and len(confirm)==1):
        v=(same or confirm)[0]; sku=slug+'|'+v['storage']; used.add(sku)
        rec.update(sku=sku,old=v.get('price'),old_condition=vcond(v),enabled=v.get('enabled',True))
        out['condition_change' if not same else 'matched'].append(rec)
    elif len(same)>1 or len(confirm)>1:
        rec['reason']='Several catalogue variants share %s %s: %s'%(storage,cond,[x['storage'] for x in same or confirm]); out['ambiguous'].append(rec)
    else:
        rec['new_sku']=slug+'|'+storage+(' · eSIM only' if esim else '')+(' · '+cond if any(vcond(x)!=cond for x in it['variants']) else '')
        out['new_variant'].append(rec)
# catalogue phones with no quote
for it in cat:
    if it['category'] in ('pixel','samsung'):
        for v in it['variants']:
            sku=it['slug']+'|'+v['storage']
            if sku not in used: out['no_quote'].append({'sku':sku,'model':it['model'],'condition':v.get('condition') or (it.get('conditions') or [''])[0],'price':v.get('price')})
json.dump(out,open('/home/claude/prices/match.json','w'),indent=1,ensure_ascii=False)
for k,v in out.items(): print(k,len(v))
