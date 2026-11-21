-- Mikee AI sales assistant: conversations and leads, the editable knowledge base, rate limits, model usage (budget),
-- WhatsApp duplicate protection and retention. Additive only: new tables and functions, nothing existing is changed.
-- Everything is server-only: RLS on, no policies, no grants to anon/authenticated. The website and the admin page
-- reach these tables only through the server functions, which use the service role.

create table if not exists public.shop_assistant_conversations(
 id uuid primary key default gen_random_uuid(),
 channel text not null default 'website' check(channel in ('website','whatsapp')),
 token_hash text,                               -- website: hash of the browser's random secret (the secret is never stored)
 external_hash text,                            -- whatsapp: salted hash of the sender's WhatsApp id
 external_ref text,                             -- whatsapp: the sender's WhatsApp id, needed to reply (cleared by retention)
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 last_customer_at timestamptz,
 ip_hash text,                                  -- salted hash only, never the raw address
 source_page text,
 state jsonb not null default '{}'::jsonb,      -- session context: product, budget, preferences (no contact details without consent)
 transcript jsonb not null default '[]'::jsonb, -- capped by the server
 message_count integer not null default 0,
 product_slug text, product_label text, storage_pref text, condition_pref text, budget_ngn bigint,
 payment_pref text, delivery_location text, timeline text,
 customer_name text, phone text, email text,
 consent boolean not null default false,        -- contact details are only kept with consent
 consent_at timestamptz, consent_version text,
 score integer not null default 0 check(score between 0 and 100),
 status text not null default 'new' check(status in ('new','exploring','interested','ready_to_buy','needs_human','converted','closed')),
 status_source text not null default 'auto' check(status_source in ('auto','admin')),
 order_reference text,                          -- set by an administrator only, after the order is verified as paid
 needs_attention boolean not null default false,
 escalation_reason text,
 handoff_at timestamptz, handoff_notified_at timestamptz,
 ai_paused boolean not null default false,
 unread_count integer not null default 0,
 admin_read_at timestamptz,
 admin_notes text,
 provider text,
 llm_calls integer not null default 0
);
create unique index if not exists shop_assistant_conv_token_idx on public.shop_assistant_conversations(token_hash) where token_hash is not null;
create unique index if not exists shop_assistant_conv_external_idx on public.shop_assistant_conversations(channel,external_hash) where external_hash is not null;
create index if not exists shop_assistant_conv_recent_idx on public.shop_assistant_conversations(updated_at desc);
create index if not exists shop_assistant_conv_status_idx on public.shop_assistant_conversations(status,needs_attention);
alter table public.shop_assistant_conversations enable row level security;
revoke all on public.shop_assistant_conversations from anon, authenticated;

-- Business knowledge edited in Admin → Mikee AI. Rows override the defaults in commerce/assistant.mjs by key.
create table if not exists public.shop_assistant_knowledge(
 key text primary key check(key ~ '^[a-z_]{2,40}$'),
 title text not null check(length(title) between 1 and 120),
 content text not null default '' check(length(content)<=1500),
 status text not null default 'needs_confirmation' check(status in ('verified','needs_confirmation','template')),
 updated_at timestamptz not null default now(),
 updated_by uuid
);
alter table public.shop_assistant_knowledge enable row level security;
revoke all on public.shop_assistant_knowledge from anon, authenticated;

create table if not exists public.shop_assistant_rate(
 key text not null, window_start timestamptz not null, hits integer not null default 0,
 primary key(key,window_start)
);
alter table public.shop_assistant_rate enable row level security;
revoke all on public.shop_assistant_rate from anon, authenticated;

create table if not exists public.shop_assistant_usage(
 day date primary key,
 llm_calls integer not null default 0,
 input_tokens bigint not null default 0,
 output_tokens bigint not null default 0,
 cost_ngn numeric(12,2) not null default 0
);
alter table public.shop_assistant_usage enable row level security;
revoke all on public.shop_assistant_usage from anon, authenticated;

-- WhatsApp Cloud API delivers webhooks at least once; each message id is processed only once.
create table if not exists public.shop_assistant_wa_events(
 message_id text primary key check(length(message_id)<=200),
 received_at timestamptz not null default now()
);
alter table public.shop_assistant_wa_events enable row level security;
revoke all on public.shop_assistant_wa_events from anon, authenticated;

-- Atomic counter for a fixed time window. Returns true while under the limit.
create or replace function public.shop_assistant_hit(p_key text,p_limit integer,p_window_seconds integer) returns boolean
language plpgsql set search_path to 'public' as $f$
declare w timestamptz; n integer;
begin
 if p_key is null or length(p_key)>200 or p_limit<1 or p_window_seconds<1 then return false;end if;
 w:=to_timestamp(floor(extract(epoch from now())/p_window_seconds)*p_window_seconds);
 insert into shop_assistant_rate(key,window_start,hits) values(p_key,w,1)
 on conflict(key,window_start) do update set hits=shop_assistant_rate.hits+1 returning hits into n;
 return n<=p_limit;
end $f$;

-- Records one model call and returns the month-to-date estimated cost in naira.
create or replace function public.shop_assistant_record_usage(p_input integer,p_output integer,p_cost_ngn numeric) returns numeric
language plpgsql set search_path to 'public' as $f$
declare d date:=(now() at time zone 'Africa/Lagos')::date; total numeric;
begin
 insert into shop_assistant_usage(day,llm_calls,input_tokens,output_tokens,cost_ngn) values(d,1,greatest(p_input,0),greatest(p_output,0),greatest(p_cost_ngn,0))
 on conflict(day) do update set llm_calls=shop_assistant_usage.llm_calls+1,input_tokens=shop_assistant_usage.input_tokens+greatest(p_input,0),
  output_tokens=shop_assistant_usage.output_tokens+greatest(p_output,0),cost_ngn=shop_assistant_usage.cost_ngn+greatest(p_cost_ngn,0);
 select coalesce(sum(cost_ngn),0) into total from shop_assistant_usage where day>=date_trunc('month',d)::date;
 return total;
end $f$;

-- Retention: chats without consent are deleted after 30 days of inactivity; consented leads keep the anonymous
-- lead record for reporting, but their contact details, WhatsApp id and transcript are cleared after 180 days.
create or replace function public.shop_assistant_purge() returns jsonb
language plpgsql set search_path to 'public' as $f$
declare a int; b int; c int; d int;
begin
 delete from shop_assistant_conversations where consent=false and status not in ('converted') and updated_at<now()-interval '30 days';get diagnostics a=row_count;
 update shop_assistant_conversations set customer_name=null,phone=null,email=null,external_ref=null,transcript='[]'::jsonb,ip_hash=null,state='{}'::jsonb
  where updated_at<now()-interval '180 days' and (phone is not null or email is not null or customer_name is not null or external_ref is not null or transcript<>'[]'::jsonb);get diagnostics b=row_count;
 delete from shop_assistant_rate where window_start<now()-interval '2 days';get diagnostics c=row_count;
 delete from shop_assistant_wa_events where received_at<now()-interval '14 days';get diagnostics d=row_count;
 return jsonb_build_object('chats_removed',a,'leads_anonymised',b,'rate_rows_removed',c,'wa_events_removed',d);
end $f$;

revoke all on function public.shop_assistant_hit(text,integer,integer) from public, anon, authenticated;
revoke all on function public.shop_assistant_record_usage(integer,integer,numeric) from public, anon, authenticated;
revoke all on function public.shop_assistant_purge() from public, anon, authenticated;

do $$ begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
  execute $q$select cron.schedule('mikee-assistant-retention','17 3 * * *','select public.shop_assistant_purge()') where not exists(select 1 from cron.job where jobname='mikee-assistant-retention')$q$;
 end if;
end $$;
