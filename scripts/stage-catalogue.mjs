// Generate SQL for review from an inventory-only JSON export. No network or database writes.
import {readFile,writeFile,access} from 'node:fs/promises';
import {planPrices} from '../commerce/catalogue-completion.mjs';
import {proposedImage} from '../commerce/catalogue-rollout.mjs';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Usage: node scripts/stage-catalogue.mjs inventory.json rollout.sql');
const rows=JSON.parse(await readFile(input,'utf8')),quote=s=>"'"+String(s).replaceAll("'","''")+"'";
if(!rows.length||new Set(rows.map(r=>r.sku)).size!==rows.length)throw Error('Invalid inventory export.');
const {changes,issues}=planPrices(rows);
const bySku=new Map(changes.map(c=>[c.sku,c])),review=new Map(issues.map(i=>[i.sku,i.reason]));
const sql=[`begin;
lock table public.checkout_inventory in share row exclusive mode;
create schema if not exists mikee_catalogue_private;
revoke all on schema mikee_catalogue_private from public;
create table if not exists mikee_catalogue_private.inventory_before_completion as table public.checkout_inventory with no data;
alter table mikee_catalogue_private.inventory_before_completion enable row level security;
create unique index if not exists inventory_before_completion_sku on mikee_catalogue_private.inventory_before_completion(sku);
insert into mikee_catalogue_private.inventory_before_completion select * from public.checkout_inventory on conflict(sku) do nothing;`];
// Validate source rows, including reference prices, before applying the plan.
// A fresh export is required if a merchant has edited inventory since planning.
sql.push(`do $$ begin if (select count(*) from public.checkout_inventory)<>${rows.length} or exists
(select 1 from (values ${rows.map(r=>'('+quote(r.sku)+','+quote(r.updated_at)+'::timestamptz)').join(',\n')})
as expected(sku,stamp) left join public.checkout_inventory inv using(sku)
where inv.updated_at is distinct from expected.stamp) then raise exception 'Inventory changed. Regenerate the plan.'; end if; end $$;`);
for(const r of rows){
 const c=bySku.get(r.sku),patch={};
 const image=proposedImage(r.product_data);
 if(image){await access('.'+image);patch.image=image;}
 if(c){patch.price=c.price;patch.calculation=c.calculation;}
 const reason=review.get(r.sku);
 if(reason&&r.product_data.priceReview!==reason)patch.priceReview=reason;
 if(Object.keys(patch).length)sql.push(`update public.checkout_inventory set product_data=product_data||${quote(JSON.stringify(patch))}::jsonb,${c?'price_ngn='+c.price+',':''} updated_at=now() where sku=${quote(r.sku)};`);
}
for(const c of changes.filter(c=>c.product))sql.push(`insert into public.checkout_inventory(sku,price_ngn,enabled,product_data) values(${quote(c.sku)},${c.price},false,${quote(JSON.stringify(c.product))}::jsonb) on conflict(sku) do nothing;`);
sql.push(`create or replace function mikee_catalogue_private.preserve_price_override() returns trigger language plpgsql set search_path='' as $$
begin
 if old.product_data ? 'calculation' and old.price_ngn is distinct from new.price_ngn then
  new.product_data=(new.product_data-'calculation')||jsonb_build_object('price',new.price_ngn,'priceSource','Admin override');
 end if;
 return new;
end $$;
create or replace trigger mikee_catalogue_price_override before update on public.checkout_inventory
for each row execute function mikee_catalogue_private.preserve_price_override();
commit;`);
await writeFile(output,sql.join('\n'),{mode:0o600});
console.log(JSON.stringify({rows:rows.length,changes:changes.length,insertions:changes.filter(c=>c.product).length,issues:issues.length}));
