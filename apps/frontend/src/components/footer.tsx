export function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 max-w-[1600px] mx-auto py-8 gap-6">
        <div className="flex items-center gap-8">
          <span className="text-sm font-semibold text-on-surface-variant">
            FLO Explorer
          </span>
          <span className="text-xs text-on-surface-variant">
            &copy; 2024 FLO Blockchain Infrastructure
          </span>
        </div>
        <nav className="flex flex-wrap justify-center gap-6">
          <a
            href="#"
            className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant hover:text-primary transition-all"
          >
            API
          </a>
          <a
            href="#"
            className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant hover:text-primary transition-all"
          >
            GitHub
          </a>
          <a
            href="#"
            className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant hover:text-primary transition-all"
          >
            Documentation
          </a>
          <a
            href="#"
            className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant hover:text-primary transition-all"
          >
            Status
          </a>
          <a
            href="#"
            className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant hover:text-primary transition-all"
          >
            Version
          </a>
        </nav>
      </div>
    </footer>
  );
}
