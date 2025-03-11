import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ComingSoonProps {
  title: string;
  description: string;
  imagePath?: string;
  showHomeButton?: boolean;
}

export function ComingSoon({ 
  title, 
  description, 
  imagePath,
  showHomeButton = true 
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      {imagePath && (
        <div className="relative w-full max-w-2xl h-64 mb-8">
          <Image
            src={imagePath}
            alt={title}
            fill
            className="object-contain"
            priority
          />
        </div>
      )}
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        {description}
      </p>
      {showHomeButton && (
        <Link href="/">
          <Button>
            Return Home
          </Button>
        </Link>
      )}
    </div>
  );
} 