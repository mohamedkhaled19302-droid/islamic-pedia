import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";

/**
 * Compact, crawlable descriptive section shown at the top of each major
 * feature page. Gives search engines real HTML text about the feature while
 * staying visually unobtrusive. Uses an <h2> so every page keeps a single
 * <h1> (the ModeHeader title) and a logical heading hierarchy.
 */
export function SeoIntro({
  title,
  children,
  links,
}: {
  title: string;
  children: ReactNode;
  links?: { to: string; label: string }[];
}) {
  return (
    <section className="mb-5 rounded-2xl border border-border bg-card/60 p-4 shadow-soft">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      <div className="mt-1.5 text-xs leading-6 text-muted-foreground">{children}</div>
      {links?.length ? (
        <nav className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border/60 pt-2.5">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </section>
  );
}
