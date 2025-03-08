import useMediaQuery from "@/hooks/mediaQuery";
import { useUser } from "@/hooks/useUser";
import { Button } from "@heroui/button";
import Link from "next/link";
import { useState } from "react";
import MobileMenu from "./Navbar/MobileMenu";
import DesktopMenu from "./Navbar/DesktopMenu";

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
        className={`navbar_content bg-zinc-950 outline-[1px] outline outline-zinc-900 !transition-all w-full min-w-fit duration-1000 ${
          (!isMobileScreen && scrolled) || location.pathname != "/"
            ? "sm:max-w-screen-xl"
            : "sm:max-w-[50px]"
        }`}
      >
        <Button
          as={Link}
          className="text-xl font-medium"
          radius="full"
          size="md"
          href={"/"}
          variant="light"
          onPress={() => setScrolled(true)}
        >
          gaia
        </Button>

        {isMobileScreen ? <MobileMenu /> : <DesktopMenu scrolled={scrolled} />}
      </div>
    </div>
  );
}
