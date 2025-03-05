"use client";

import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AddGoalDialog from "@/components/Goals/AddGoalDialog";
import { GoalCard } from "@/components/Goals/GoalCard";
import { Target04Icon } from "@/components/Misc/icons";
import { apiauth } from "@/utils/apiaxios";
import { Chip } from "@heroui/chip";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prevGoalTitle, setPrevGoalTitle] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const router = useRouter(); // Use Next.js router

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await apiauth.get("/goals");

      console.log("goals", response.data);
      setGoals(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalTitle: string) => {
    try {
      const response = await apiauth.post("/goals", { title: goalTitle });

      router.push(`/goals/${response.data.id}`); // Use router.push instead of navigate()
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = (goalTitle: string) => {
    createGoal(goalTitle);
  };

  return (
    <>
      <div className="flex flex-col justify-between h-full w-full">
        <div className="w-full overflow-y-auto">
          <div className="flex items-center flex-col gap-2 w-full">
            <div className="font-bold text-center sm:text-5xl text-3xl">
              Roadmaps
            </div>
            <div className=" text-center text-md pb-6 max-w-screen-md">
              A tool that instantly generates personalized goal roadmaps from a
              single prompt, helping you plan and track your objectives
              efficiently.
            </div>
          </div>

          {goals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-1 pb-28 sm:px-16 gap-4 justify-center">
              {goals.map((goal, index) => (
                <GoalCard key={index} fetchGoals={fetchGoals} goal={goal} />
              ))}
            </div>
          ) : (
            <div className="h-[70vh] w-full flex items-center justify-center">
              {loading ? <Spinner /> : <div>No Goals created yet.</div>}
            </div>
          )}
        </div>
        <div className="absolute left-0 bottom-6 flex justify-center items-center w-full z-10 flex-col gap-4">
          <div className="flex flex-wrap gap-2 max-w-screen-lg justify-center">
            {[
              "Build a strong morning routine",
              "Read 12 books this year",
              "Develop better financial habits",
              "Journal daily for self-reflection",
              "Workout consistently for 3 months",
              "Improve work-life balance",
              "Master full-stack development",
            ].map((suggestion, index) => (
              <Chip
                key={index}
                variant="flat"
                color="primary"
                className="cursor-pointer"
                onClick={() => {
                  setPrevGoalTitle(suggestion);
                  setOpenDialog(true);
                }}
              >
                {suggestion}
              </Chip>
            ))}
          </div>
          <Button
            className="font-semibold gap-2"
            color="primary"
            radius="full"
            size="lg"
            variant="shadow"
            onPress={() => setOpenDialog(true)}
          >
            <Target04Icon height={23} width={23} />
            Create a new Goal
          </Button>
        </div>
        <div className="bg-custom-gradient2 left-0 absolute bottom-0 w-full h-[100px] z-[1]" />
      </div>
      <AddGoalDialog
        addGoal={handleAddGoal}
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        prevGoalTitle={prevGoalTitle}
      />
    </>
  );
}
