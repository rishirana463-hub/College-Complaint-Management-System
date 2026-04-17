import Sidebar from "./Sidebar";

const Layout = ({ title, subtitle, children, actions }) => {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(61,131,114,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.14),_transparent_30%),linear-gradient(180deg,_#f7fbfa_0%,_#edf5f3_52%,_#e8f0ef_100%)] p-4 md:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute left-[7%] top-24 h-40 w-40 rounded-full bg-brand-200/50 blur-3xl" />
        <div className="absolute bottom-16 right-[12%] h-56 w-56 rounded-full bg-slate-300/60 blur-3xl" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <main className="relative space-y-6">
          <section className="card overflow-hidden border-white/70 bg-white/80">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-brand-600">Portal</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
                {subtitle && <p className="mt-2 max-w-2xl text-sm text-slate-600">{subtitle}</p>}
              </div>
              {actions}
            </div>
          </section>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
