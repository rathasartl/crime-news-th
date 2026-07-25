import { getArticles } from "@/lib/queries";
import { Feed } from "@/components/Feed";
import { Header } from "@/components/Header";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const articles = await getArticles({ limit: 60 });
  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-6">
      <Header count={articles.length} />
      <Feed articles={articles} />
    </main>
  );
}
