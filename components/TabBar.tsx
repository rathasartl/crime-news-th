"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  match: (path: string) => boolean;
}

const ITEMS: NavItem[] = [
  {
    href: "/",
    label: "หน้าแรก",
    icon: "📰",
    match: (p) => p === "/" || p === ""
  },
  {
    href: "/categories",
    label: "หมวดหมู่",
    icon: "☰",
    match: (p) => p === "/categories"
  }
];

export function TabBar({ active }: { active?: "home" | "categories" }) {
  const path = usePathname();
  return (
    <nav
      aria-label="หน้าหลัก"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-rule)] bg-[var(--color-paper)]/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-2xl">
        {ITEMS.map((item) => {
          const isActive = active
            ? (active === "home" && item.href === "/") ||
              (active === "categories" && item.href === "/categories")
            : item.match(path);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition " +
                (isActive
                  ? "text-[var(--color-ink)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink-soft)]")
              }
            >
              <span
                className={"text-lg leading-none transition " + (isActive ? "scale-110" : "")}
                aria-hidden
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              <span
                aria-hidden
                className={
                  "h-0.5 w-6 rounded-full transition " +
                  (isActive ? "bg-[var(--color-ink)]" : "bg-transparent")
                }
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
