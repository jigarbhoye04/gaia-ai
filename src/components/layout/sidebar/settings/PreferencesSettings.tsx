"use client";

import { Input, Select, SelectItem, Textarea } from "@heroui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { countries, Country } from "@/components/country-selector";
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

  const handleCountryChange = (countryCode: string) => {
    const updatedPreferences = { ...preferences, country: countryCode };
    setPreferences(updatedPreferences);
    debouncedUpdate(updatedPreferences);
  };

  const handleProfessionChange = (profession: string) => {
    const updatedPreferences = { ...preferences, profession };
    setPreferences(updatedPreferences);
    debouncedUpdate(updatedPreferences);
  };

  const handleResponseStyleChange = (responseStyle: string) => {
    const updatedPreferences = {
      ...preferences,
      response_style: responseStyle,
    };
    setPreferences(updatedPreferences);
    debouncedUpdate(updatedPreferences);
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
    <div className="flex min-h-full flex-col gap-4">
      <h3 className="mb-3">Preferences</h3>

      {/* Personal Information */}
      <div className="flex w-full flex-col gap-4 rounded-2xl bg-black/40 p-4">
        <h4 className="text-sm font-medium text-foreground-500">
          Personal Information
        </h4>

        <div className="space-y-4">
          <Select
            label="Country"
            placeholder="Select your country"
            selectedKeys={preferences.country ? [preferences.country] : []}
            onChange={(e) => handleCountryChange(e.target.value)}
            isDisabled={isUpdating}
            classNames={{
              trigger: "bg-zinc-800 border-zinc-700 hover:bg-zinc-700",
              popoverContent: "bg-zinc-800 border-zinc-700",
              listbox: "bg-zinc-800",
            }}
          >
            {countries.map((country: Country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="Profession"
            placeholder="Select your profession"
            selectedKeys={
              preferences.profession ? [preferences.profession] : []
            }
            onChange={(e) => handleProfessionChange(e.target.value)}
            isDisabled={isUpdating}
            classNames={{
              trigger: "bg-zinc-800 border-zinc-700 hover:bg-zinc-700",
              popoverContent: "bg-zinc-800 border-zinc-700",
              listbox: "bg-zinc-800",
            }}
          >
            {professionOptions.map((profession) => (
              <SelectItem key={profession.value} value={profession.value}>
                {profession.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Communication Style */}
      <div className="flex w-full flex-col gap-4 rounded-2xl bg-black/40 p-4">
        <h4 className="text-sm font-medium text-foreground-500">
          Communication Style
        </h4>

        <div className="space-y-4">
          <Select
            label="Response Style"
            placeholder="Select response style"
            selectedKeys={
              responseStyleOptions.some(
                (option) => option.value === preferences.response_style,
              )
                ? [preferences.response_style]
                : ["other"]
            }
            onChange={(e) => handleResponseStyleChange(e.target.value)}
            isDisabled={isUpdating}
            classNames={{
              trigger: "bg-zinc-800 border-zinc-700 hover:bg-zinc-700",
              popoverContent: "bg-zinc-800 border-zinc-700",
              listbox: "bg-zinc-800",
            }}
          >
            {responseStyleOptions.map((style) => (
              <SelectItem key={style.value} value={style.value}>
                <div>
                  <div className="font-medium">
                    {style.value.charAt(0).toUpperCase() + style.value.slice(1)}
                  </div>
                  <div className="text-xs text-foreground-400">
                    {style.label.split(" - ")[1]}
                  </div>
                </div>
              </SelectItem>
            ))}
          </Select>

          {/* Custom response style input */}
          {(preferences.response_style === "other" ||
            !responseStyleOptions.some(
              (option) => option.value === preferences.response_style,
            )) && (
            <Input
              label="Custom Response Style"
              placeholder="Describe your preferred response style..."
              value={
                responseStyleOptions.some(
                  (option) => option.value === preferences.response_style,
                )
                  ? ""
                  : preferences.response_style
              }
              onChange={(e) => handleCustomResponseStyleChange(e.target.value)}
              isDisabled={isUpdating}
              classNames={{
                input: "bg-zinc-800 border-zinc-700",
                inputWrapper: "bg-zinc-800 border-zinc-700 hover:bg-zinc-700",
              }}
            />
          )}
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="flex w-full flex-col gap-4 rounded-2xl bg-black/40 p-4">
        <h4 className="text-sm font-medium text-foreground-500">
          Custom Instructions
        </h4>

        <Textarea
          label="Special Instructions"
          placeholder="Add any specific instructions for how GAIA should assist you..."
          value={preferences.custom_instructions || ""}
          onChange={(e) => handleCustomInstructionsChange(e.target.value)}
          isDisabled={isUpdating}
          minRows={3}
          description="These instructions will be included in every conversation to personalize GAIA's responses."
        />
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
