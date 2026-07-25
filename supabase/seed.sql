-- Seed the 6 verified Thai sources
insert into sources (slug, name, feed_url, site_url, language) values
  ('khaosod',       'ข่าวสด',         'https://www.khaosod.co.th/feed',           'https://www.khaosod.co.th', 'th'),
  ('khaosod-crime', 'ข่าวสด (อาชญากรรม)', 'https://www.khaosod.co.th/crime/feed', 'https://www.khaosod.co.th', 'th'),
  ('prachachat',    'ประชาชาติธุรกิจ',   'https://www.prachachat.net/feed',         'https://www.prachachat.net', 'th'),
  ('thestandard',   'เดอะสแตนดาร์ด',     'https://thestandard.co/feed/',            'https://thestandard.co', 'th'),
  ('brighttv',      'ไบรท์ทีวี',         'https://www.brighttv.co.th/feed',         'https://www.brighttv.co.th', 'th'),
  ('inn',           'เอ็นเน็วส์',          'https://www.innnews.co.th/feed/',         'https://www.innnews.co.th', 'th')
on conflict (slug) do nothing;
