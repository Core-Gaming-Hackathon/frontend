"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@/providers/evm-wallet-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Navigation() {
  const { address, isConnected, signIn, signOut } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Function to format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Handle wallet connection
  const handleConnectWallet = async () => {
    if (isConnected) {
      await signOut();
    } else {
      await signIn();
    }
  };

  return (
    <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-lg z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/baultro.svg"
            alt="Baultro Logo"
            width={40}
            height={40}
            className="w-10 h-10"
          />
          <span className="font-bold text-xl">Baultro</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/game"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Play Now
          </Link>
          <Link
            href="/predict"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Predictions
          </Link>
          <Link
            href="/marketplace"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Marketplace
          </Link>
          <Link
            href="/leaderboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Leaderboard
          </Link>
          
          {/* Wallet Button */}
          <Button
            onClick={handleConnectWallet}
            className="bg-primary ml-4"
            variant={isConnected ? "outline" : "default"}
          >
            {isConnected
              ? `${formatAddress(address || "")}`
              : "Connect Wallet"}
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button
        title="Menu"
          className="md:hidden p-2 rounded-md"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-menu"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>

        {/* Mobile Menu */}
        <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Menu</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Link
                href="/game"
                className="px-4 py-2 hover:bg-secondary rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Play Now
              </Link>
              <Link
                href="/predict"
                className="px-4 py-2 hover:bg-secondary rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Predictions
              </Link>
              <Link
                href="/marketplace"
                className="px-4 py-2 hover:bg-secondary rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Marketplace
              </Link>
              <Link
                href="/leaderboard"
                className="px-4 py-2 hover:bg-secondary rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Leaderboard
              </Link>
              <Button
  onClick={() => {
    handleConnectWallet();
    setIsMenuOpen(false);
  }}
  className="mt-2"
  variant={isConnected ? "outline" : "default"}
>
  {isConnected
    ? `${formatAddress(address || "")}`
    : "Connect Wallet"}
</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
