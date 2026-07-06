import { createFileRoute, Link } from "@tanstack/react-router";

export default function LandingHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav
        className="flex items-center justify-between p-6 lg:px-8 max-w-[1220px] mx-auto"
        aria-label="Global"
      >
        <div className="flex lg:flex-1 justify-left items-center ">
          <Link
            to="/"
            className="-m-1.5 p-1.5 flex items-center gap-2 font-black text-2xl tracking-tight text-[#131b2e]"
          >
            <img src="/logo-tr.png" alt="SalesSync AI" className="h-10 w-auto pb-1 " />
            <span className="text-[#131b2e] ">SalesSync</span>
          </Link>
        </div>
        <div className="flex flex-1 justify-end items-center gap-x-6">
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
  );
}
