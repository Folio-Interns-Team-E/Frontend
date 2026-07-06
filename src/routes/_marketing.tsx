import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_marketing")({
  beforeLoad: ({ context }) => {
    const state = context.store.getState();
    // If they are logged in, send them straight to the app workspace
    if (state.app.auth.loggedIn) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: MarketingLayout,
});

function MarketingLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      {/* Integrated Global Navigation Header */}
      <header className="absolute inset-x-0 top-0 z-50 ">
        <nav
          className="flex items-center justify-between px-6 py-3 lg:px-8 max-w-[1220px] mx-auto"
          aria-label="Global"
        >
          <div className="flex lg:flex-1">
            <Link
              to="/"
              className="-m-1.5 p-1.5 flex items-center gap-2 font-black text-2xl tracking-tight text-[#131b2e]"
            >
              <img src="/logo-blue.png" alt="SalesSync AI" className="h-20 pb-1 w-auto" />
            </Link>
          </div>
          <div className="flex flex-1 justify-end items-center gap-x-6">
            <Link
              to="/pricing"
              className="text-sm font-semibold leading-6 text-[#505f76] hover:text-primary transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold leading-6 text-[#505f76] hover:text-primary transition-colors"
            >
              Log in
            </Link>
            <Link to="/register" className="primary-action">
              Get Started Free
            </Link>
          </div>
        </nav>
      </header>

      {/* Target Route Content Canvas */}
      <div className="w-full flex-1">
        <Outlet />
      </div>

      {/* Integrated Shared Structured Footer */}
      <footer className="border-t border-outline-variant/30 bg-white/60 backdrop-blur-md py-8 z-10">
        <div className="page-shell flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#505f76]">
          <div className="flex items-center gap-2 font-bold text-sm text-[#131b2e]">
            <img src="/logo-tr.png" alt="" className="h-6 w-auto" />
            <span>SalesSync AI</span>
          </div>
          <p>&copy; {new Date().getFullYear()} SalesSync Inc. All capabilities autonomous.</p>
        </div>
      </footer>
    </div>
  );
}
