import { Outlet } from "react-router-dom";

import { Header } from "./Header";

export const ShellLayout = () => (
  <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#fff7ed_45%,#eff6ff_100%)] text-slate-900">
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="absolute right-[-5%] top-1/4 h-80 w-80 rounded-full bg-teal-300/30 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-rose-300/20 blur-3xl" />
    </div>
    <div className="relative">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Outlet />
      </main>
    </div>
  </div>
);

