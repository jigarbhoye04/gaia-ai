"use client";

import {
  Input,
  Select,
  SelectItem,
  SharedSelection,
  Textarea,
} from "@heroui/react";
import { Globe, MessageSquare, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { CountrySelector } from "@/components/country-selector";
import { authApi } from "@/features/auth/api/authApi";
import { useUser } from "@/features/auth/hooks/useUser";

const responseStyleOptions = [
  { value: "brief", label: "Brief - Keep responses concise and to the point" },
  { value: "detailed", label: "Detailed - Provide comprehensive explanations" },
  { value: "casual", label: "Casual - Use a friendly and informal tone" },
  {
    value: "professional",
    label: "Professional - Maintain a formal and business-like tone",
  },
  { value: "other", label: "Other - Define your own response style" },
];

const professionOptions = [
  { value: "student", label: "Student" },
  { value: "developer", label: "Software Developer" },
  { value: "designer", label: "Designer" },
  { value: "manager", label: "Manager" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "consultant", label: "Consultant" },
  { value: "researcher", label: "Researcher" },
  { value: "teacher", label: "Teacher" },
  { value: "writer", label: "Writer" },
  { value: "analyst", label: "Analyst" },
  { value: "engineer", label: "Engineer" },
  { value: "marketer", label: "Marketer" },
  { value: "other", label: "Other" },
];

export default function PreferencesSettings() {
  const user = useUser();
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [preferences, setPreferences] = useState({
    country: user.onboarding?.preferences?.country || "",
    profession: user.onboarding?.preferences?.profession || "",
    response_style: user.onboarding?.preferences?.response_style || "",
    custom_instructions:
      user.onboarding?.preferences?.custom_instructions || null,
  });

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPreferences = useRef(preferences);

  const updatePreferences = useCallback(
    async (updatedPreferences: typeof preferences) => {
      try {
        setIsUpdating(true);
        setHasUnsavedChanges(false);

        const response = await authApi.updatePreferences(updatedPreferences);

        if (response.success) {
          toast.success("Preferences saved");
          lastSavedPreferences.current = updatedPreferences;
        } else {
          // Rollback on failure
          setPreferences(lastSavedPreferences.current);
          setHasUnsavedChanges(true);
          toast.error("Failed to save preferences");
        }
      } catch (error) {
        console.error("Error updating preferences:", error);
        // Rollback on failure
        setPreferences(lastSavedPreferences.current);
        setHasUnsavedChanges(true);
        toast.error("Failed to save preferences");
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  // Debounced update function
  const debouncedUpdate = useCallback(
    (updatedPreferences: typeof preferences) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      setHasUnsavedChanges(true);

      updateTimeoutRef.current = setTimeout(() => {
        updatePreferences(updatedPreferences);
      }, 1000); // Wait 1 second after user stops typing
    },
    [updatePreferences],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const handleCountryChange = (countryCode: string | null) => {
    if (countryCode) {
      const updatedPreferences = { ...preferences, country: countryCode };
      setPreferences(updatedPreferences);
      debouncedUpdate(updatedPreferences);
    }
  };

  const handleProfessionChange = (keys: SharedSelection) => {
    if (keys !== "all" && keys.size > 0) {
      const profession = Array.from(keys)[0] as string;
      const updatedPreferences = { ...preferences, profession };
      setPreferences(updatedPreferences);
      debouncedUpdate(updatedPreferences);
    }
  };

  const handleResponseStyleChange = (keys: SharedSelection) => {
    if (keys !== "all" && keys.size > 0) {
      const responseStyle = Array.from(keys)[0] as string;
      const updatedPreferences = {
        ...preferences,
        response_style: responseStyle === "other" ? "custom" : responseStyle,
      };
      setPreferences(updatedPreferences);
      debouncedUpdate(updatedPreferences);
    }
  };

  const handleCustomResponseStyleChange = (customStyle: string) => {
    const updatedPreferences = {
      ...preferences,
      response_style: customStyle,
    };
    setPreferences(updatedPreferences);
    debouncedUpdate(updatedPreferences);
  };

  const handleCustomInstructionsChange = (customInstructions: string) => {
    // Convert empty strings to null for backend
    const instructions =
      customInstructions.trim() === "" ? null : customInstructions;
    const updatedPreferences = {
      ...preferences,
      custom_instructions: instructions,
    };
    setPreferences(updatedPreferences);
    debouncedUpdate(updatedPreferences);
  };

  return (
    <div className="w-full space-y-6">
      <div className="rounded-2xl bg-zinc-900 p-6">
        <div className="mb-6 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10">
            <User className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">Personal Information</h3>
            <p className="text-sm text-zinc-400">
              Configure your personal details and location
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Country</label>
            <CountrySelector
              selectedKey={preferences.country}
              onSelectionChange={handleCountryChange}
              placeholder="Select your country"
              label=""
              isDisabled={isUpdating}
              variant="bordered"
              radius="lg"
              classNames={{
                base: "w-full",
                popoverContent: "bg-zinc-800 border-zinc-700",
                listboxWrapper: "bg-zinc-800",
                selectorButton:
                  "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 data-[hover=true]:bg-zinc-700",
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Profession
            </label>
            <Select
              placeholder="Select your profession"
              selectedKeys={
                preferences.profession
                  ? new Set([preferences.profession])
                  : new Set()
              }
              onSelectionChange={handleProfessionChange}
              isDisabled={isUpdating}
              classNames={{
                trigger:
                  "bg-zinc-800 hover:bg-zinc-700 cursor-pointer min-h-[44px]",
                popoverContent: "bg-zinc-800 z-50",
                listbox: "bg-zinc-800",
                value: "text-white",
              }}
            >
              {professionOptions.map((profession) => (
                <SelectItem key={profession.value}>
                  {profession.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Communication Style */}
      <div className="rounded-2xl bg-zinc-900 p-6">
        <div className="mb-6 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10">
            <MessageSquare className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">Communication Style</h3>
            <p className="text-sm text-zinc-400">
              Customize how GAIA responds to your messages
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Response Style
            </label>
            <Select
              placeholder="Select response style"
              selectedKeys={
                preferences.response_style
                  ? responseStyleOptions.some(
                      (option) => option.value === preferences.response_style,
                    )
                    ? new Set([preferences.response_style])
                    : new Set(["other"])
                  : new Set()
              }
              disallowEmptySelection={false}
              onSelectionChange={handleResponseStyleChange}
              isDisabled={isUpdating}
              classNames={{
                trigger:
                  "bg-zinc-800 hover:bg-zinc-700 cursor-pointer min-h-[44px]",
                popoverContent: "bg-zinc-800 z-50",
                listbox: "bg-zinc-800",
                value: "text-white",
              }}
            >
              {responseStyleOptions.map((style) => (
                <SelectItem
                  key={style.value}
                  textValue={
                    style.value.charAt(0).toUpperCase() + style.value.slice(1)
                  }
                >
                  <div>
                    <div className="font-medium">
                      {style.value.charAt(0).toUpperCase() +
                        style.value.slice(1)}
                    </div>
                    <div className="text-xs text-foreground-400">
                      {style.label.split(" - ")[1]}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Custom response style input */}
          {preferences.response_style &&
            !responseStyleOptions.some(
              (option) => option.value === preferences.response_style,
            ) && (
              <div className="space-y-2">
                <Input
                  placeholder="Describe your preferred response style..."
                  value={preferences.response_style || ""}
                  onChange={(e) =>
                    handleCustomResponseStyleChange(e.target.value)
                  }
                  isDisabled={isUpdating}
                  classNames={{
                    input: "bg-zinc-800 min-h-[44px]",
                    inputWrapper: "bg-zinc-800 hover:bg-zinc-700",
                  }}
                />
              </div>
            )}
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="rounded-2xl bg-zinc-900 p-6">
        <div className="mb-6 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10">
            <Globe className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">Custom Instructions</h3>
            <p className="text-sm text-zinc-400">
              Add personalized instructions for GAIA to follow
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Add any specific instructions for how GAIA should assist you..."
            value={preferences.custom_instructions || ""}
            onChange={(e) => handleCustomInstructionsChange(e.target.value)}
            isDisabled={isUpdating}
            minRows={4}
            classNames={{
              input: "bg-zinc-800",
              inputWrapper: "bg-zinc-800 hover:bg-zinc-700",
            }}
          />
          <p className="text-xs text-zinc-400">
            These instructions will be included in every conversation to
            personalize GAIA's responses.
          </p>
        </div>
      </div>

      {/* Status indicator */}
      <div className="text-center">
        {isUpdating && (
          <p className="text-sm text-blue-400">Saving preferences...</p>
        )}
        {hasUnsavedChanges && !isUpdating && (
          <p className="text-sm text-yellow-400">Unsaved changes</p>
        )}
        {!hasUnsavedChanges && !isUpdating && (
          <p className="text-sm text-green-400">All changes saved</p>
        )}
      </div>
    </div>
  );
}
