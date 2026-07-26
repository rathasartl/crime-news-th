-- 0004: keyword-based crime filter (no AI needed)
-- Add default_category + crime_keywords to sources so we can filter
-- general RSS feeds to crime-only without an LLM call.

alter table sources
  add column if not exists default_category text,
  add column if not exists crime_keywords text[] default '{}';

-- ---------------------------------------------------------------------------
-- Update existing sources with crime keywords (Thai + English)
-- ---------------------------------------------------------------------------
-- Thai general feeds: filter by Thai crime keywords
update sources set
  default_category = 'other_crime',
  crime_keywords = ARRAY[
    'ฆ่า','ฆาต','ตาย','เสียชีวิต','ศพ',
    'ปล้น','ลัก','ฉก','ฉุด','ขโมย','รีดไถ',
    'โกง','สแกม','ปลอม','เช็คเด้ง','ฟอกเงิน',
    'ยาบ้า','ยาเสพติด','น้ำแข็ง','กัญชา','เฮโรอีน',
    'แฮก','มัลแวร์','ข้อมูล','ฟิชชิ่ง',
    'ทุจริต','ยักยอก','สินบน','ภาษี',
    'ข่มขืน','ล่วงละเมิด','ค้ามนุษย์','คุกคาม',
    'อุบัติเหตุ','ชน','เมา','แข่งรถ',
    'ปืน','อาวุธ','ระเบิด','พนัน','บุกรุก',
    'จับกุม','สอบสวน','ตำรวจ','คดี','อัยการ','ศาล'
  ]
where language = 'th';

-- Khaosod-crime already crime-only
update sources set
  default_category = 'other_crime',
  crime_keywords = ARRAY[]::text[]
where slug = 'khaosod-crime';

-- International feeds: filter by English crime keywords
update sources set
  default_category = 'other_crime',
  crime_keywords = ARRAY[
    'kill','kills','killed','killing','murder','homicide','manslaughter',
    'shoot','shooting','shot','gun','firearm',
    'rob','robbery','robbed','theft','stolen','steal','stealing','burglar',
    'assault','attack','stab','stabb','beat',
    'rape','sexual','molest','abuse',
    'fraud','scam','scammer','swindle','embezzle',
    'drug','narcotic','cocaine','heroin','meth','fentanyl','opioid',
    'hack','cyber','malware','ransomware','phish','data breach',
    'arrest','charged','convict','sentence','guilty','indict','felony',
    'corrupt','bribery','money laundering','racketeer',
    'kidnap','abduct','hostage',
    'crash','collision','drunk driv','dui',
    'crime','criminal','police','sheriff','detective','prosecutor','judge','court','jury'
  ]
where language = 'en';

-- ---------------------------------------------------------------------------
-- Add crime-specific sources (no keyword filter needed — already curated)
-- ---------------------------------------------------------------------------
insert into sources (slug, name, feed_url, site_url, language, country, emoji, default_category, crime_keywords) values
  ('cbs-crime',     'CBS News Crime',  'https://www.cbsnews.com/latest/rss/crime', 'https://www.cbsnews.com/crime/', 'en', 'US', '🇺🇸', 'other_crime', ARRAY[]::text[]),
  ('crime-online',  'Crime Online',    'https://www.crimeonline.com/feed/',         'https://www.crimeonline.com',     'en', 'US', '🇺🇸', 'other_crime', ARRAY[]::text[])
on conflict (slug) do update set
  feed_url = excluded.feed_url,
  site_url = excluded.site_url,
  language = excluded.language,
  country = excluded.country,
  emoji = excluded.emoji,
  default_category = excluded.default_category,
  crime_keywords = excluded.crime_keywords;

-- ---------------------------------------------------------------------------
-- Remove general international feeds that have lots of non-crime noise
-- Keep BBC World (good signal), drop BBC News (duplicate), drop NYT World (low crime ratio)
-- Actually keep all — we'll filter by keyword now.
-- ---------------------------------------------------------------------------

-- Index for faster lookups
create index if not exists articles_translated_idx
  on articles (is_translated, published_at desc)
  where hidden = false;
