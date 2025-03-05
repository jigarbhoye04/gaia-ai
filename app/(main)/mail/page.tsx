import { ChevronDown, ChevronUp, Star } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";

function DraftEmail() {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`absolute bottom-0 right-3 overflow-hidden transition-all duration-500 ${
        open ? "w-[50vw] h-[50vh] bg-zinc-900 " : "w-[250px]  h-10 bg-primary"
      }  rounded-t-lg text-white p-2 px-3 shadow-xl`}
    >
      <div
        className="w-full flex justify-between cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="font-medium">Create new Email</div>
        {open ? <ChevronDown /> : <ChevronUp />}
      </div>
    </div>
  );
}

export default function Emails() {
  return (
    <div className=" w-full h-screen ">
      <Table
        aria-label="Example static collection table"
        selectionMode="multiple"
      >
        <TableHeader className="w-fit">
          <TableColumn>Star</TableColumn>
          <TableColumn>From</TableColumn>
          <TableColumn>Subject</TableColumn>
          <TableColumn>Label</TableColumn>
          <TableColumn>Time</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"You have no emails to display."}>
          <TableRow key="1">
            <TableCell>
              <Star width={22} color="#9b9b9b" />
            </TableCell>
            <TableCell>lorem@ipsum.com</TableCell>
            <TableCell>test</TableCell>
            <TableCell>
              <Chip color="success" size="sm">
                Test
              </Chip>
            </TableCell>
            <TableCell>date</TableCell>
          </TableRow>
          <TableRow key="2">
            <TableCell>
              <Star width={22} color="#9b9b9b" />
            </TableCell>
            <TableCell>a@aryanranderiya.com</TableCell>
            <TableCell>Technical Lead</TableCell>
            <TableCell>
              <Chip color="danger" size="sm">
                Test
              </Chip>
            </TableCell>
            <TableCell>date</TableCell>
          </TableRow>
          <TableRow key="3">
            <TableCell>
              <Star width={22} color="#9b9b9b" />
            </TableCell>
            <TableCell>foo@bar.co</TableCell>
            <TableCell className="text-nowrap truncate !max-w-[30vw]">
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Id
              necessitatibus odit praesentium voluptatibus impedit ab tempore
              molestiae soluta facilis. Laborum cumque aut accusamus tempora,
              cum adipisci officiis nisi possimus porro? Dolore et debitis
              soluta provident ratione minima corrupti, animi nihil, odio amet
              reprehenderit modi ducimus nulla omnis expedita autem! Eos quasi,
              odit culpa quidem voluptatem repellendus eligendi necessitatibus
              iusto accusantium velit reprehenderit inventore impedit.
              Distinctio fugiat iste dolorum accusantium magni sapiente optio
              rem dolor minima ducimus consequuntur cum corporis laborum,
              aliquid impedit iusto tempore reiciendis asperiores sunt deleniti
              itaque temporibus. Minus natus maxime fuga, iusto facilis
              exercitationem odit molestiae nulla.
            </TableCell>
            <TableCell>
              <Chip color="secondary" size="sm">
                Test
              </Chip>
            </TableCell>
            <TableCell>date</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <DraftEmail />
    </div>
  );
}
