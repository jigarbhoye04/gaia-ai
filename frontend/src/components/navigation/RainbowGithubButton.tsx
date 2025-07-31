import { useGitHubStars } from "@/hooks/useGitHubStars";
import { StarFilledIcon } from "@radix-ui/react-icons";
import { Github } from "../shared";

export function RainbowGithubButton() {
  const { data: repoData, isLoading: isLoadingStars } =
    useGitHubStars("heygaia/gaia");

  return (
    <a
      href="https://github.com/heygaia/gaia"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative inline-flex h-9 max-h-9 min-h-9 cursor-pointer items-center justify-center rounded-xl border border-transparent bg-zinc-800 px-3 text-sm font-medium text-white transition-all duration-300 hover:scale-105 hover:bg-zinc-800"
    >
      <div className="animate-rainbow flex items-center">
        <Github width={18} />
        <span className="ml-1">GitHub</span>
        <div className="ml-2 flex items-center gap-2 text-sm">
          <StarFilledIcon className="h-4 w-4 text-orange-300 transition-colors" />
          <span className="font-display inline-block font-medium tracking-wider tabular-nums">
            {isLoadingStars ? "..." : repoData?.stargazers_count || 0}
          </span>
        </div>
      </div>
    </a>
  );
}
