// import { Note } from "@/pages/Notes";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  // ModalHeader,
} from "@heroui/modal";
import { DotsVerticalIcon } from "@radix-ui/react-icons";

export function NoteDialog({
  openDialog,
  setOpenDialog,
  // note,
  onDelete,
}: {
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
  // note: Note;
  onDelete: () => void;
}) {
  return (
    <Modal
      backdrop="blur-sm"
      className="text-foreground dark"
      isDismissable={false}
      isOpen={openDialog}
      onOpenChange={setOpenDialog}
    >
      <ModalContent>
        {/* <ModalHeader className="flex flex-col gap-1">{note.title}</ModalHeader> */}

        <ModalBody>
          {/* <p className="text-md">{note.description}</p> */}

          {/* Dropdown for options */}
          <Dropdown className="dark">
            <DropdownTrigger>
              <Button isIconOnly variant="flat">
                <DotsVerticalIcon />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Note actions"
              className="dark"
              onAction={(key) => {
                if (key === "delete") {
                  onDelete();
                  setOpenDialog(false);
                }
              }}
            >
              <DropdownItem key="delete" className="text-red-500 dark">
                Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </ModalBody>

        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={() => setOpenDialog(false)} // Close dialog
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
