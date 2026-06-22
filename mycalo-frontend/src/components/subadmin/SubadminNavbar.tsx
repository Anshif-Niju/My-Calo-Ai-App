"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/subadmin/dashboard",
    label: "Dashboard",
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: "/subadmin/doctors",
    label: "Doctors",
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    href: "/subadmin/settings",
    label: "Settings",
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function SubadminNavbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop top navbar */}
      <nav
        className="hidden lg:flex fixed top-0 left-0 right-0 z-50 h-16 items-center px-8 justify-between border-b"
        style={{ background: "#ffffff", borderColor: "#e2e8f0" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🛡️</span>
          <span className="font-black text-xl leading-none" style={{ color: "#0f172a" }}>
            MyCalo AI Sub-Admin
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-[18px] border border-slate-100 shadow-inner">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-[14px] text-[13px] font-bold transition-all duration-300"
                style={{
                  background: active ? "#0f172a" : "transparent",
                  color: active ? "#ffffff" : "#64748b",
                }}
              >
                {item.icon(active)}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom navbar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-sm"
        style={{ background: "rgba(255,255,255,0.9)", borderColor: "#e2e8f0" }}
      >
        <div className="flex items-center justify-around h-16 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all"
                style={{ color: active ? "#0f172a" : "#94a3b8" }}
              >
                {item.icon(active)}
                <span className={`text-[10px] font-bold ${active ? "font-black" : ""}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
