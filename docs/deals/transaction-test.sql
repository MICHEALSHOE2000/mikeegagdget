do $$
declare actor uuid:=gen_random_uuid(); request uuid:=gen_random_uuid(); result jsonb; replay jsonb; ref text;
begin
 insert into auth.users(id,email,email_confirmed_at) values(actor,'aderintomicheal6@gmail.com',now());
 perform shop_provision_owner(actor);
 insert into checkout_inventory(sku,price_ngn,enabled,product_data) values('DEALS-QA|256GB',105,true,'{"slug":"qa","image":"/qa.webp","colors":[]}'),('DEALS-QA|512GB',200,true,'{"slug":"qa","image":"/qa.webp","colors":[]}');
 perform shop_publish_deals(actor,array['DEALS-QA|256GB'],0);
 begin perform shop_publish_deals(actor,array['DEALS-QA|256GB'],0);raise exception 'TEST stale publish allowed';exception when others then if sqlerrm='TEST stale publish allowed' then raise;end if;end;
 begin perform shop_publish_deals(actor,array['DEALS-QA|256GB','DEALS-QA|256GB'],1);raise exception 'TEST duplicate allowed';exception when others then if sqlerrm='TEST duplicate allowed' then raise;end if;end;
 result=shop_create_order_deals(request,'[{"sku":"DEALS-QA|256GB","quantity":2},{"sku":"DEALS-QA|512GB","quantity":1}]','{"email":"qa-deals@example.invalid"}','2026-11-11');
 if (result->>'amount_ngn')::bigint<>390 then raise exception 'TEST incorrect mixed total: %',result;end if;
 ref=result->>'reference';
 if (select unit_price_ngn from shop_order_items i join shop_orders o on o.id=i.order_id where o.reference=ref and i.sku='DEALS-QA|256GB')<>95 then raise exception 'TEST rounding mismatch';end if;
 if (select price_ngn from checkout_inventory where sku='DEALS-QA|256GB')<>105 then raise exception 'TEST base price mutated';end if;
 perform shop_publish_deals(actor,'{}',1);
 replay=shop_create_order_deals(request,'[{"sku":"DEALS-QA|256GB","quantity":2},{"sku":"DEALS-QA|512GB","quantity":1}]','{"email":"qa-deals@example.invalid"}','2026-11-11');
 if replay->>'amount_ngn'<>result->>'amount_ngn' then raise exception 'TEST existing order repriced';end if;
 if shop_confirm_payment(ref,1,'deals-qa-underpay')<>'manual_review' then raise exception 'TEST underpay accepted';end if;
 if shop_confirm_payment(ref,39000,'deals-qa-correct')<>'paid' then raise exception 'TEST valid pay rejected';end if;
 if shop_confirm_payment(ref,39000,'deals-qa-correct')<>'paid' then raise exception 'TEST replay failed';end if;
 if has_function_privilege('anon','public.shop_publish_deals(uuid,text[],integer)','EXECUTE') then raise exception 'TEST public write permitted';end if;
 if has_table_privilege('authenticated','public.shop_deal_settings','UPDATE') then raise exception 'TEST client write permitted';end if;
end $$;
