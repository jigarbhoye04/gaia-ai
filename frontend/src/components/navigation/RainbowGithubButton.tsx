import { useGitHubStars } from "@/hooks/useGitHubStars";
import { Github } from "../shared";
import { StarFilledIcon } from "@radix-ui/react-icons";

export function RainbowGithubButton() {
  const { data: repoData, isLoading: isLoadingStars } = useGitHubStars("heygaia/gaia");

  return (
    <a
      href="https://github.com/heygaia/gaia"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative inline-flex items-center justify-center h-9 px-4 py-2 text-sm font-medium text-white transition-all duration-300 cursor-pointer rounded-xl border-0 bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%] [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent] before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] before:[filter:blur(calc(0.8*1rem))] dark:bg-[linear-gradient(#fff,#fff),linear-gradient(#fff_50%,rgba(255,255,255,0.6)_80%,rgba(0,0,0,0)),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] animate-rainbow before:animate-rainbow"
      style={{
        '--color-1': '#ff0080',
        '--color-2': '#7928ca',
        '--color-3': '#ff4081',
        '--color-4': '#00d4ff',
        '--color-5': '#7c3aed'
      } as React.CSSProperties}
    >
      <div className="flex items-center animate-rainbow text-black">
        <Github width={18} />
        <span className="ml-1">Star on GitHub</span>
        <div className="ml-2 flex items-center gap-1 text-sm">
          <StarFilledIcon className="w-4 h-4 text-[#6A7486] group-hover:text-yellow-300 transition-colors" />
          <span className="inline-block tabular-nums tracking-wider font-display font-medium">
            {isLoadingStars ? "..." : repoData?.stargazers_count || 0}
          </span>
        </div>
      </div>
    </a>
  );
}
