export function Footer() {
  return (
    <footer className="border-t py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>FLO Explorer — Open source blockchain explorer for the FLO network</p>
          <p>
            Powered by{" "}
            <a
              href="https://github.com/init0/flora"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Flora
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
