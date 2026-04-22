import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background/50 px-4 py-6 text-center text-xs text-muted-foreground">
      <div className="flex flex-wrap justify-center gap-4 mb-3">
        <Link to="/privacy" className="hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
        <span className="text-border/40">•</span>
        <Link to="/terms" className="hover:text-foreground transition-colors">
          Terms of Service
        </Link>
      </div>
      <p>© 2026 Sektion. All rights reserved.</p>
    </footer>
  );
};
