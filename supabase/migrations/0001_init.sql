-- Crime News TH — initial schema
-- Run: supabase db push  OR  paste into SQL Editor

create extension if not exists "pg_cron";

-- ---------------------------------------------------------------------------
-- Sources
-- ---------------------------------------------------------------------------
create table if not exists sources (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  feed_url    text not null,
  site_url    text,
  language    text not null default 'th',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists sources_active_idx on sources (is_active);

-- ---------------------------------------------------------------------------
-- Articles
-- ---------------------------------------------------------------------------
do $$ begin
  create type crime_category as enum (
    'murder',         -- ฆาตกรรม / ทำร้ายร่างกาย
    'theft_robbery',  -- ลักทรัพย์ / ปล้น / ฉุด
    'fraud_scam',     -- ฉ้อโกง / คอลสแกม
    'drugs',          -- ยาเสพติด
    'cybercrime',     -- ไซเบอร์อาชญากรรม
    'white_collar',   -- ทุจริต / ฟอกเงิน / อาชญากรรมผู้ทุน
    'sexual',         -- รุนแรงทางเพศ / คุกคาม
    'traffic',        -- อุบัติเหตุรุนแรง / ขับรถชน
    'other_crime',    -- คดีอาชญากรรมอื่น ๆ
    'not_crime'       -- ไม่ใช่อาชญากรรม (กรองออก)
  );
exception when duplicate_object then null; end $$;

create table if not exists articles (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references sources (id) on delete cascade,
  external_id   text,
  url           text not null,
  title         text not null,
  raw_excerpt   text,
  content_html  text,
  image_url     text,
  published_at  timestamptz not null,
  fetched_at    timestamptz not null default now(),

  -- AI-generated
  summary_th    text,
  category      crime_category,
  confidence    real check (confidence between 0 and 1),
  location      text,
  ai_model      text,
  summarized_at timestamptz,

  -- Deduplication
  content_hash  text not null,

  -- Reader UX
  click_count   integer not null default 0,
  hidden        boolean not null default false,

  created_at    timestamptz not null default now()
);

-- One article per (source, content_hash) — idempotent refetch
create unique index if not exists articles_source_hash_uniq
  on articles (source_id, content_hash);

-- One article per URL per source (catches duplicate URLs)
create unique index if not exists articles_source_url_uniq
  on articles (source_id, url);

-- Reverse-chronological feed
create index if not exists articles_published_idx
  on articles (published_at desc);

-- Category filter
create index if not exists articles_category_published_idx
  on articles (category, published_at desc)
  where hidden = false;

-- ---------------------------------------------------------------------------
-- Helper: text search (simple, no Thai tokenizer — uses ILIKE)
-- ---------------------------------------------------------------------------
create index if not exists articles_title_trgm_idx
  on articles using gin (title gin_trgm_ops);
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Storage budget guard: trim to last 30 days nightly
-- ---------------------------------------------------------------------------
create or replace function trim_old_articles(days_to_keep int default 30)
returns void language plpgsql security definer as $$
begin
  delete from articles
  where published_at < now() - (days_to_keep || ' days')::interval
    and id not in (
      select id from articles
      where click_count > 0
      order by published_at desc
      limit 100
    );
end $$;

-- Schedule nightly trim at 03:00 UTC (10:00 Bangkok)
-- Run only ONCE; comment out after first execution.
-- select cron.schedule('trim-old-articles', '0 3 * * *', $$select trim_old_articles(30)$$);
