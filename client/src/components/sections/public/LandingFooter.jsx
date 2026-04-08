export const LandingFooter = () => {
  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-foreground">ShareBit</p>
          <p>Fractional investment platform for verified income assets.</p>
        </div>
        <div className="text-xs md:text-right">
          <p>Copyright 2026 ShareBit. All rights reserved.</p>
          <p>Transparency, governance, and investor-first operations.</p>
        </div>
      </div>
    </footer>
  );
};
