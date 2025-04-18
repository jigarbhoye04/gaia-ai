import OrbitingCircles from "../MagicUI/orbiting-circles";
import {
  ComputerIcon,
  Github,
  Gmail,
  GoogleCalendar,
  GoogleDrive,
  Notion,
  SmartPhone01Icon,
  Watch02Icon,
} from "../Misc/icons";

function MiddleIcons() {
  return (
    <>
      <OrbitingCircles
        bgcircle={false}
        className="orbiting_circles_mid border-none bg-transparent"
        delay={30}
        duration={30}
        radius={135}
      >
        <GoogleCalendar />
      </OrbitingCircles>
      <OrbitingCircles
        bgcircle={false}
        className="orbiting_circles_mid border-none bg-transparent"
        delay={40}
        duration={30}
        radius={135}
      >
        <Gmail />
      </OrbitingCircles>
      <OrbitingCircles
        bgcircle={false}
        className="orbiting_circles_mid border-none bg-transparent"
        delay={50}
        duration={30}
        radius={135}
      >
        <GoogleDrive />
      </OrbitingCircles>
    </>
  );
}

function InnerIcons() {
  return (
    <>
      <OrbitingCircles
        reverse
        bgcircle={false}
        className="orbiting_circles_inner border-none bg-transparent"
        duration={20}
        radius={70}
      >
        <Notion />
      </OrbitingCircles>
      <OrbitingCircles
        reverse
        bgcircle={false}
        className="orbiting_circles_inner border-none bg-transparent"
        delay={20}
        duration={20}
        radius={70}
      >
        <Github />
      </OrbitingCircles>
    </>
  );
}

function OuterIcons() {
  return (
    <>
      <OrbitingCircles
        reverse
        className="orbiting_circles_outer border-none bg-transparent"
        duration={25}
        radius={200}
      >
        <SmartPhone01Icon height="40px" width={"40px"} />
      </OrbitingCircles>

      <OrbitingCircles
        reverse
        className="orbiting_circles_outer border-none bg-transparent"
        delay={26}
        duration={25}
        radius={200}
      >
        <ComputerIcon height="40px" width={"40px"} />
      </OrbitingCircles>
      <OrbitingCircles
        reverse
        className="orbiting_circles_outer border-none bg-transparent"
        delay={17}
        duration={25}
        radius={200}
      >
        <Watch02Icon height="40px" width={"40px"} />
      </OrbitingCircles>
    </>
  );
}

export default function IntegrationCircles() {
  return (
    <div className="flex w-screen items-center justify-center md:scale-100">
      <div className="relative flex h-screen w-full items-center justify-center rounded-lg md:shadow-xl">
        <span className="pointer-events-none relative bg-linear-to-b from-black to-gray-300 bg-clip-text text-center text-6xl leading-none font-semibold whitespace-pre-wrap text-transparent dark:from-white dark:to-zinc-900">
          Integrated with Workspaces
        </span>

        <MiddleIcons />
        <InnerIcons />
        <OuterIcons />
      </div>
    </div>
  );
}
