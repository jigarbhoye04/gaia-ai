import type { Metadata } from "next";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/shadcn/avatar";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about GAIA, your personal AI assistant designed to enhance productivity, automate tasks, and assist in daily activities.",
  openGraph: {
    title: "About",
    siteName: "GAIA - Personal Assistant",
    url: "https://heygaia.io/about",
    type: "website",
    description:
      "Learn more about GAIA, your personal AI assistant designed to enhance productivity, automate tasks, and assist in daily activities.",
    images: ["/landing/screenshot.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "About",
    description:
      "Learn more about GAIA, your personal AI assistant designed to enhance productivity, automate tasks, and assist in daily activities.",
    images: ["/landing/screenshot.webp"],
  },
  keywords: [
    "GAIA",
    "About GAIA",
    "AI Assistant",
    "Artificial Intelligence",
    "Productivity Assistant",
    "Virtual Assistant",
    "Smart Assistant",
    "AI Personal Assistant",
    "Task Management",
    "Automation",
  ],
};

export default function About() {
  return (
    <div className="flex min-h-screen w-screen justify-center pt-28">
      <div className="max-w-(--breakpoint-md) space-y-2">
        <h1 className="text-center">
          GAIA Lorem, ipsum dolor sit amet consectetur
        </h1>
        <div className="text-justify">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Magnam eos
          totam rerum inventore hic voluptatem porro et quia eum. Atque vel
          dolorum ducimus delectus vitae repellat corrupti quaerat asperiores,
          quasi fugiat tempore reiciendis. Quia quo similique pariatur quam
          facilis voluptatum, dolorum fuga, hic harum quaerat consequatur eum
          quae vero recusandae suscipit cum saepe ducimus aspernatur deserunt?
          Amet ipsa in corrupti ipsum nisi ab, officiis ea ratione quo, ullam
          enim saepe inventore maiores? Quidem distinctio quasi sed, atque
          tempora vitae laboriosam, rem, delectus illo similique aspernatur
          asperiores exercitationem est hic? Velit, obcaecati sed ut autem ex
          officiis necessitatibus, eligendi consequatur repellat recusandae
          saepe. Natus ab quam iusto placeat nostrum excepturi dolores, quae
          iure nemo illo asperiores nisi neque doloribus quos sapiente nam vel,
          esse deleniti, voluptate a saepe. Facilis quaerat placeat dolorem ex
          laborum impedit et tempore sapiente? Repudiandae mollitia molestiae
          assumenda. Reprehenderit numquam veritatis, iste animi sit quia harum.
          Quia blanditiis dignissimos, laboriosam exercitationem sapiente sed
          quos quidem obcaecati. Voluptatem vero consequuntur esse a ducimus
          ipsum distinctio, fugiat impedit molestias mollitia voluptates
          nesciunt numquam pariatur aut modi explicabo expedita veritatis
          incidunt nemo illum officiis aperiam reiciendis molestiae. Officia
          minus accusamus consequatur sint eaque suscipit quis mollitia illo
          deleniti delectus perferendis rem repudiandae temporibus, dolorum
          saepe quam iusto doloribus in nesciunt error ratione odio adipisci
          quidem! Eaque, officiis quas fugiat architecto culpa mollitia nobis
          dolores voluptatibus impedit aut veniam ducimus dignissimos obcaecati
          facere a dolorum magnam? Nostrum dignissimos voluptatum error, magnam
          eveniet inventore ab, tempora nihil officia accusamus sed architecto
          perspiciatis modi et culpa quasi nam ad recusandae iure voluptatibus
          ex quam provident consequatur dolorum. Sunt eaque, sapiente,
          laboriosam architecto veritatis placeat laudantium explicabo
          perferendis quas quam harum distinctio aliquid, ullam voluptatibus
          pariatur dolores. Distinctio, odio eius molestiae mollitia quasi nemo.
          Cupiditate doloribus, minus praesentium dolores totam laborum ea
          voluptatum repellendus similique eligendi et hic aliquid expedita,
          quasi sed mollitia adipisci, harum quibusdam nisi reiciendis saepe
          asperiores. Aperiam sint sapiente doloremque quos, itaque repellat quo
          dolor earum rerum consectetur officia atque ullam? Vel, incidunt
          aspernatur natus voluptatum cum deserunt velit ipsum praesentium
          itaque? Fugit, esse officia vitae impedit eaque cupiditate unde
          tenetur deleniti, corporis beatae, quasi ratione accusamus tempore ea.
          Repudiandae eligendi vel nulla? Saepe, a. Facilis cupiditate rem vel
          nulla repudiandae vitae, veniam quisquam corporis illo? Dolores illum
          distinctio ex sed quo voluptas corrupti quae nemo odio nobis eius
          cumque officiis explicabo aliquid voluptate ullam repellat suscipit
          ipsum, repudiandae maiores tempora temporibus, culpa fuga quas.
          Deleniti ad omnis ipsa aut, quaerat odit placeat animi ut, quod sed
          officiis porro voluptate laborum odio temporibus cum rem sunt. Iste
          repudiandae, distinctio dolor eaque a quisquam deserunt repellat
          quibusdam quasi ipsum possimus porro laudantium magni dolore, suscipit
          neque! Aut atque reiciendis dolores sint expedita esse pariatur, quae
          labore minima eligendi delectus, commodi excepturi laboriosam sed
          quasi hic? Omnis eius labore aperiam nostrum, hic sit odit voluptatum
          quia iure praesentium debitis et, porro enim ex officiis! Dolorum
          illum, laudantium beatae ab, nesciunt facere excepturi accusamus nam
          dolorem sunt earum eveniet quae necessitatibus, debitis sint.
        </div>
        <div className="flex items-center justify-center gap-3 py-3">
          <Avatar className="size-9 rounded-full">
            <AvatarImage
              src={"https://github.com/aryanranderiya.png"}
              alt="Avatar"
            />
            <AvatarFallback>AR</AvatarFallback>
          </Avatar>

          <div>
            <div>Aryan Randeriya</div>
            <div className="text-sm text-foreground-500">— Founder & CEO</div>
          </div>
        </div>
      </div>
    </div>
  );
}
