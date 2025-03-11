import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function GameModesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Select Game Mode</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose from multiple AI-powered game modes, each offering unique
          challenges and rewards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Battle Mode */}
        <Link 
          href="/game/battle" 
          className="group relative rounded-lg overflow-hidden border border-border transition-all hover:border-primary/50 hover:shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/5 group-hover:opacity-100 transition-opacity z-0"></div>
          <div className="absolute top-0 right-0 w-1/2 h-1/2 opacity-30">
            <Image
              src="/decor/modes/vs-bg.svg"
              alt="Battle Background"
              fill
              className="object-contain opacity-20 group-hover:opacity-40 transition-opacity"
            />
          </div>
          <div className="p-8 relative z-10">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 mr-4">
                <Image
                  src="/decor/modes/vs.svg"
                  alt="Battle Mode"
                  width={64}
                  height={64}
                />
              </div>
              <h2 className="text-2xl font-bold">Battle Mode</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Challenge other players to 1v1 duels where you attempt to hack into
              each other&apos;s AI security vaults. Test your skills in social engineering
              and prompt design.
            </p>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Difficulty:</span>{" "}
                <span className="text-muted-foreground">Medium</span>
              </div>
              <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Play Now
              </Button>
            </div>
          </div>
        </Link>

        {/* Raid Mode */}
        <Link 
          href="/game/raid" 
          className="group relative rounded-lg overflow-hidden border border-border transition-all hover:border-primary/50 hover:shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-orange-600/5 group-hover:opacity-100 transition-opacity z-0"></div>
          <div className="absolute top-0 right-0 w-1/2 h-1/2 opacity-30">
            <Image
              src="/decor/modes/raid-bg.svg"
              alt="Raid Background"
              fill
              className="object-contain opacity-20 group-hover:opacity-40 transition-opacity"
            />
          </div>
          <div className="p-8 relative z-10">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 mr-4">
                <Image
                  src="/decor/modes/raid.svg"
                  alt="Raid Mode"
                  width={64}
                  height={64}
                />
              </div>
              <h2 className="text-2xl font-bold">Raid Mode</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              One player sets up a vault that multiple players attempt to break,
              with increasing fees and rewards based on difficulty. Will you be the
              one to crack the code?
            </p>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Difficulty:</span>{" "}
                <span className="text-muted-foreground">Hard</span>
              </div>
              <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Play Now
              </Button>
            </div>
          </div>
        </Link>

        {/* Love Mode */}
        <Link 
          href="/game/love" 
          className="group relative rounded-lg overflow-hidden border border-border transition-all hover:border-primary/50 hover:shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 to-red-600/5 group-hover:opacity-100 transition-opacity z-0"></div>
          <div className="absolute top-0 right-0 w-1/2 h-1/2 opacity-30">
            <Image
              src="/decor/modes/heart-bg.svg"
              alt="Love Background"
              fill
              className="object-contain opacity-20 group-hover:opacity-40 transition-opacity"
            />
          </div>
          <div className="p-8 relative z-10">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 mr-4">
                <Image
                  src="/decor/modes/heart.svg"
                  alt="Love Mode"
                  width={64}
                  height={64}
                />
              </div>
              <h2 className="text-2xl font-bold">Love Mode</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Players compete to make an opposing AI say &quot;I love you&quot; in a battle of
              charm and persuasion. Can you break through its emotional defenses and
              win its heart?
            </p>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Difficulty:</span>{" "}
                <span className="text-muted-foreground">Easy</span>
              </div>
              <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Play Now
              </Button>
            </div>
          </div>
        </Link>

        {/* Mystery Mode */}
        <Link 
          href="/game/mystery" 
          className="group relative rounded-lg overflow-hidden border border-border transition-all hover:border-primary/50 hover:shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-600/5 group-hover:opacity-100 transition-opacity z-0"></div>
          <div className="absolute top-0 right-0 w-1/2 h-1/2 opacity-30">
            <Image
              src="/decor/modes/mystery-bg.svg"
              alt="Mystery Background"
              fill
              className="object-contain opacity-20 group-hover:opacity-40 transition-opacity"
            />
          </div>
          <div className="p-8 relative z-10">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 mr-4">
                <Image
                  src="/decor/modes/mystery.svg"
                  alt="Mystery Mode"
                  width={64}
                  height={64}
                />
              </div>
              <h2 className="text-2xl font-bold">Mystery Mode</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Players try to extract a secret code from an AI character through
              clever questioning and deduction. Solve the puzzle before time runs
              out to win the prize!
            </p>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Difficulty:</span>{" "}
                <span className="text-muted-foreground">Medium</span>
              </div>
              <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Play Now
              </Button>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
