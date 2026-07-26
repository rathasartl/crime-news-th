import { NextResponse, type NextRequest } from "next/server";

const CACHE_PATHS = new Set(["/", "/categories"]);

export function proxy(req: NextRequest) {
  const res = NextResponse.next();

  if (CACHE_PATHS.has(req.nextUrl.pathname)) {
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
  }

  return res;
}

export const config = {
  matcher: ["/", "/categories"]
};
