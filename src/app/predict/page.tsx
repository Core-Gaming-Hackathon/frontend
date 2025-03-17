"use client";

import React from "react";
import { EVMWalletProvider } from "@/providers/evm-wallet-provider";
import dynamic from "next/dynamic";

// Use dynamic import with SSR disabled for the main page component
const PredictionsPage = dynamic(
  () => import("./predictions-page"),
  { 
    ssr: false,
    loading: () => <PredictionsPageSkeleton />
  }
);

// Simple skeleton loader
function PredictionsPageSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-4"></div>
      <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

// Export the page as the default export
export default function Page() {
  return (
    <EVMWalletProvider>
      <PredictionsPage />
    </EVMWalletProvider>
  );
}