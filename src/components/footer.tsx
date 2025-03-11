import Link from "next/link";
import React from "react";

export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row ml-6">
        <div className="text-center md:text-left text-sm ml-6">
          <p className="text-muted-foreground ml-6">
            &copy; {new Date().getFullYear()} Baultro - All rights reserved
          </p>
        </div>

        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
