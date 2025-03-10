import { siteConfig } from "@/config/siteConfig";
import useMediaQuery from "@/hooks/mediaQuery";
import { Button } from "@heroui/button";
import Link from "next/link";
import { useState } from "react";
import { BookOpen02Icon, GlobalIcon, Idea01Icon, MapsIcon } from "./icons";
import DesktopMenu from "./Navbar/DesktopMenu";
import MobileMenu from "./Navbar/MobileMenu";
import { LinkButton } from "./LinkButton";

export default function Navbar() {
  const isMobileScreen = useMediaQuery("(max-width: 600px)");
  const [scrolled, setScrolled] = useState(true);

  // useEffect(() => {
  //   const handleScroll = () => {
  //     if (window.scrollY > 30) {
  //       setScrolled(true);
  //       window.removeEventListener("scroll", handleScroll);
  //     }
  //   };
  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

  return (
    <div className="navbar">
      <div
        //  outline-[1px] outline outline-zinc-900
        className={`navbar_content rounded-2xl bg-zinc-950/60 backdrop-blur-lg !transition-all w-full min-w-fit duration-1000 ${
          (!isMobileScreen && scrolled) || location.pathname != "/"
            ? "sm:max-w-screen-xl"
            : "sm:max-w-[50px]"
        }`}
      >
        <Button
          as={Link}
          className="text-lg font-medium"
          radius="lg"
          href={"/"}
          variant="light"
          onPress={() => setScrolled(true)}
        >
          {siteConfig.name}
        </Button>

        <div className="flex items-center gap-1">
          <LinkButton
            size="sm"
            className="font-medium text-sm text-zinc-400 hover:text-zinc-300"
            as={Link}
            href="/about"
            startContent={<GlobalIcon color={undefined} width={19} />}
          >
            About
          </LinkButton>

          <LinkButton
            size="sm"
            className="font-medium text-sm text-zinc-400 hover:text-zinc-300"
            as={Link}
            href="/blog"
            startContent={<BookOpen02Icon color={undefined} width={19} />}
          >
            Blog
          </LinkButton>

          <LinkButton
            size="sm"
            className="font-medium text-sm text-zinc-400 hover:text-zinc-300"
            external
            href="https://gaia.featurebase.app"
            startContent={<Idea01Icon color={undefined} width={19} />}
          >
            Feature Request
          </LinkButton>

          <LinkButton
            size="sm"
            className="font-medium text-sm text-zinc-400 hover:text-zinc-300"
            external
            href="https://gaia.featurebase.app/roadmap"
            startContent={<MapsIcon color={undefined} width={19} />}
          >
            Roadmap
          </LinkButton>
        </div>

        {isMobileScreen ? <MobileMenu /> : <DesktopMenu scrolled={scrolled} />}
      </div>
    </div>
  );
}
