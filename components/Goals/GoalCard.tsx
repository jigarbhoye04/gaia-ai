import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
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
  ModalHeader,
} from "@heroui/modal";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import { CalendarSimpleIcon, Target04Icon } from "@/components/Misc/icons";
import { GoalData } from "@/app/goals/page";
import { apiauth } from "@/utils/apiaxios";
import { useRouter } from "next/router";
import { toast } from "sonner";

export function GoalCard({
  goal,
  fetchGoals,
}: {
  goal: GoalData;
  fetchGoals: () => void;
}) {
  const router = useRouter();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  async function deleteGoal(goalId: string) {
    try {
      const response = await apiauth.delete(`/goals/${goalId}`);

      console.log("Goal deleted successfully:", response.data);
      toast.success("Goal deleted successfully");
      fetchGoals();
    } catch (error) {
      toast.error("Error deleting goal. Please try again later.");
      console.error("Error deleting goal:", error);
    }
  }

  const handleDelete = () => {
    deleteGoal(goal?.id);
    setOpenDeleteDialog(false);
  };

  return (
    <>
      <Modal
        className="dark text-foreground"
        isOpen={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
      >
        <ModalContent>
          <ModalHeader className="inline-block">
            Are you sure you want to delete the roadmap titled
            <span className="ml-1 font-normal text-primary-500">
              {goal?.roadmap?.title || goal.title}
            </span>
            <span className="ml-1">?</span>
          </ModalHeader>

          <ModalBody>
            <p className="text-danger-400 font-medium">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={() => setOpenDeleteDialog(false)}
            >
              Close
            </Button>
            <Button color="primary" onPress={handleDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <div className="bg-black bg-opacity-50 flex flex-col p-4 rounded-lg  w-full group">
        <div className="font-medium text-lg flex items-center gap-2 w-full relative ">
          <Target04Icon height={20} width={20} color="#9b9b9b" />
          <span className="truncate w-[85%]">
            {goal?.roadmap?.title || goal.title}
          </span>

          <div className="absolute -right-2 group-hover:opacity-100 opacity-0 transition-opacity dark">
            <Dropdown
              classNames={{
                content: "bg-zinc-900",
              }}
            >
              <DropdownTrigger>
                <Button isIconOnly variant="flat">
                  <DotsVerticalIcon />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Static Actions" className="dark">
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  onPress={() => setOpenDeleteDialog(true)}
                >
                  Delete Roadmap
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        <Chip
          className="mt-2"
          color={
            !goal.roadmap?.nodes?.length || !goal.roadmap?.edges?.length
              ? "warning"
              : goal.progress === 100
              ? "success"
              : goal.progress > 0
              ? "primary"
              : "warning"
          }
          size="sm"
          variant="flat"
        >
          {!goal.roadmap?.nodes?.length || !goal.roadmap?.edges?.length
            ? "Not Started"
            : goal.progress === 100
            ? "Completed"
            : goal.progress > 0
            ? "In Progress"
            : "Not Started"}
        </Chip>

        <div className="my-3 flex items-center gap-2 justify-between">
          <div className="bg-black h-3 rounded-full relative w-[100%]">
            <div
              className={`absolute left-0 bg-[#00bbff] top-0 h-3 rounded-full`}
              style={{ width: `${goal?.progress || 0}%` }}
            />

            <div
              className={`absolute left-0 bg-[#00bbff40] top-0 h-3 rounded-full w-full`}
              // style={{ width: `${goal?.progress || 0}%` }}
            />
          </div>
          <span className="text-xs">{goal?.progress || 0}%</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-foreground-500 flex text-sm items-center gap-1 mt-2">
            <CalendarSimpleIcon width={20} />
            {new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            }).format(new Date(goal?.created_at))}
          </div>
          <Button
            color="primary"
            // size="sm"
            variant="flat"
            onPress={() => router.push(`/${goal.id}`)}
          >
            View Goal
          </Button>
        </div>
      </div>
    </>
  );
}
