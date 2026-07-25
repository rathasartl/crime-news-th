# อาชญากรรม — ฟีดข่าว

Next.js + Supabase + Anthropic Haiku 4.5 reader for Thai + global crime news. Aggregates RSS from 6 Thai outlets every 5 minutes, dedupes by content hash, AI-summarizes in Thai, auto-tags into 9 crime categories.

## Architecture

```
RSS (Khaosod, Prachachat, The Standard, Bright TV, INN)
  ↓ GitHub Actions cron */5 * * * *
  ↓
fetch-news.ts (Bun) ─→ Anthropic Haiku 4.5 (Thai summary + tag) ─→ Supabase
  ↓
Next.js (ISR 60s) → Mobile-first feed → Vercel
```

## Setup

### 1. Supabase project

1. Create new project at https://supabase.com/dashboard
2. SQL Editor → New query → paste `supabase/migrations/0001_init.sql` → Run
3. Run `supabase/seed.sql` to insert the 6 source rows
4. Project Settings → API → copy `Project URL`, `anon public` key, `service_role` key

### 2. Anthropic

https://console.anthropic.com/settings/keys → create key. Haiku 4.5 at ~$0.001/summary; ~200 articles × 12 cycles/hour × 24 hours = ~$50/day worst-case. In practice RSS feeds deliver 30–60 new articles/day, so ~$0.05/day.

### 3. Local dev

```bash
cp .env.local.example .env.local
# Fill in real values
bun install
bun run dev            # http://localhost:3000
bun run fetch-news     # one-shot manual fetch
```

### 4. Deploy

```bash
# Push to GitHub
gh repo create crime-news-th --private --source=. --remote=origin --push

# Add GitHub Actions secrets
gh secret set -R crime-news-th NEXT_PUBLIC_SUPABASE_URL          < .env.local
gh secret set -R crime-news-th NEXT_PUBLIC_SUPABASE_ANON_KEY     < .env.local
gh secret set -R crime-news-th SUPABASE_SERVICE_ROLE_KEY         < .env.local
gh secret set -R crime-news-th ANTHROPIC_API_KEY                 < .env.local

# Trigger first fetch
gh workflow run -R crime-news-th "Fetch news"

# Vercel
vercel --prod
# Paste same env vars when prompted
```

### 5. Verify

- Visit Vercel URL on mobile — should see feed
- GitHub Actions tab → "Fetch news" workflow → green checkmarks every 5 min
- Supabase Table Editor → `articles` → row count climbing

## Costs (typical)

| Resource       | Free tier        | This app                  |
|----------------|------------------|---------------------------|
| Supabase       | 500MB DB, 50k MAU| < 10MB, 1 user            |
| Vercel Hobby   | 100GB bandwidth  | < 1GB                     |
| GitHub Actions | 2000 min/month   | ~7200 min (may overflow)  |
| Anthropic      | pay-per-token    | ~$1/month                 |

If GitHub Actions overflows, switch the cron to a free [cron-job.org](https://cron-job.org) trigger hitting `POST /api/cron/fetch` on Vercel — also free.

## Sources

| Slug | Outlet | Feed |
|------|--------|------|
| khaosod | ข่าวสด | https://www.khaosod.co.th/feed |
| khaosod-crime | ข่าวสด (อาชญากรรม) | https://www.khaosod.co.th/crime/feed |
| prachachat | ประชาชาติธุรกิจ | https://www.prachachat.net/feed |
| thestandard | เดอะสแตนดาร์ด | https://thestandard.co/feed |
| brighttv | ไบรท์ทีวี | https://www.brighttv.co.th/feed |
| inn | เอ็นเน็วส์ | https://www.innnews.co.th/feed |

Add/remove via `supabase/seed.sql` or directly in Supabase Table Editor.

## Categories

AI tags each article as one of:
`murder` · `theft_robbery` · `fraud_scam` · `drugs` · `cybercrime` · `white_collar` · `sexual` · `traffic` · `other_crime` · `not_crime`

`not_crime` rows are stored (for backfill) but hidden from the default feed. To show them, change the `includeNotCrime` flag in `lib/queries.ts`.

## License

Private — personal use only.
