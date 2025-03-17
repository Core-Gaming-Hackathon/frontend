"use client";

import { useWallet } from "@/providers/evm-wallet-provider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Loader2 } from "lucide-react";

// Contract owner address - the only one who can resolve battles
const CONTRACT_OWNER = "0x87f603924309889B39687AC0A1669b1E5a506E74";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { address, isConnected } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if wallet is connected and is the contract owner
    setIsAdmin(isConnected && address?.toLowerCase() === CONTRACT_OWNER.toLowerCase());
    setIsChecking(false);
    
    // If not admin after checking, redirect to home page
    if (!isChecking && !isAdmin && isConnected) {
      router.push('/');
    }
  }, [address, isConnected, router, isChecking, isAdmin]);

  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive" className="mb-6">
          <ShieldAlert className="h-4 w-4 mr-2" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Please connect your wallet to access the admin area.
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive" className="mb-6">
          <ShieldAlert className="h-4 w-4 mr-2" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            This area is restricted to the contract owner. Your wallet address does not have admin privileges.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If admin, render the children
  return (
    <div className="container mx-auto py-6">
      {children}
    </div>
  );
} 