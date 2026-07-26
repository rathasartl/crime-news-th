-- 0003: relax URL uniqueness — keep hash as primary dedupe
-- The articles_source_url_uniq constraint fires on upsert because Supabase's
-- ignoreDuplicates only handles the specified onConflict column, not other
-- unique indexes. Content hash is the canonical dedupe key.

drop index if exists articles_source_url_uniq;
