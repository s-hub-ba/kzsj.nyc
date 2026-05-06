import Link from "next/link";

const links = [
  { href: "/admin", label: "Pregled" },
  { href: "/admin?section=classes", label: "Programi" },
  { href: "/admin?section=terms", label: "Termini" },
  { href: "/admin?section=bookings", label: "Rezervacije" },
  { href: "/admin?section=blog", label: "Blog" },
  { href: "/admin?section=newsletter", label: "Newsletter" },
];

export function AdminSidebar() {
  return (
    <aside className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="mb-4 text-2xl text-brand-2">Admin</h2>
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-text"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
