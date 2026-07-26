-- 0002: language support + international sources
-- Run after 0001_init.sql + seed.sql

-- Add country to sources for flag display
alter table sources
  add column if not exists country text not null default 'TH',
  add column if not exists emoji text;

-- Article: original language + translation flag
alter table articles
  add column if not exists source_language text not null default 'th',
  add column if not exists is_translated boolean not null default false;

-- Update existing sources with country + emoji
update sources set
  country = 'TH',
  emoji = '🇹🇭'
where country is null or country = 'TH';

-- ---------------------------------------------------------------------------
-- International sources (language='en')
-- ---------------------------------------------------------------------------
insert into sources (slug, name, feed_url, site_url, language, country, emoji) values
  ('bbc-world',       'BBC News World',  'http://feeds.bbci.co.uk/news/world/rss.xml',  'https://www.bbc.com/news/world',  'en', 'GB', '🇬🇧'),
  ('guardian-world',  'The Guardian',    'https://www.theguardian.com/world/rss',       'https://www.theguardian.com/world', 'en', 'GB', '🇬🇧'),
  ('nyt-world',       'NYT World',       'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', 'https://www.nytimes.com/section/world', 'en', 'US', '🇺🇸'),
  ('aljazeera',       'Al Jazeera',      'https://www.aljazeera.com/xml/rss/all.xml',   'https://www.aljazeera.com', 'en', 'QA', '🇶🇦'),
  ('abc-world',       'ABC News International', 'https://feeds.abcnews.com/abcnews/internationalheadlines', 'https://abcnews.go.com/International', 'en', 'US', '🇺🇸'),
  ('cbs-world',       'CBS News World',  'https://www.cbsnews.com/latest/rss/world',    'https://www.cbsnews.com/world', 'en', 'US', '🇺🇸'),
  ('bbc-news',        'BBC News',        'http://feeds.bbci.co.uk/news/rss.xml',        'https://www.bbc.com/news', 'en', 'GB', '🇬🇧')
on conflict (slug) do update set
  feed_url = excluded.feed_url,
  site_url = excluded.site_url,
  language = excluded.language,
  country = excluded.country,
  emoji = excluded.emoji;

-- Backfill Thai sources with emoji
update sources set emoji = '🇹🇭', country = 'TH' where slug in ('khaosod', 'khaosod-crime', 'prachachat', 'thestandard', 'brighttv', 'inn') and emoji is null;
