"use client";

import { Tick02Icon } from "@/components/Misc/icons";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import React from "react";

interface PricingCardProps {
  title: string;
  // description: string;
  type: "main" | "secondary";
  price: number;
  discountPercentage?: number; // new prop for discount percentage
  featurestitle: React.ReactNode;
  features?: string[];
  durationIsMonth: boolean;
  className?: string;
}

export function PricingCard({
  title,
  // description,
  type,
  price,
  discountPercentage = 0,
  featurestitle,
  features,
  durationIsMonth,
  className,
}: PricingCardProps) {
  const yearlyPrice = price * 12;
  const discountAmount = !durationIsMonth
    ? (discountPercentage / 100) * yearlyPrice
    : 0;
  const finalPrice = durationIsMonth ? price : yearlyPrice - discountAmount;

  return (
    <>
      <div
        className={`w-full relative rounded-2xl ${className} ${type === "main"
            ? "bg-zinc-900  outline outline-2 outline-primary"
            : "bg-zinc-900 "
          } `}
      >
        <div className="p-[7%] h-full flex-col flex gap-4">
          <div className="flex flex-row justify-between items-center !border-none">
            <div className="text-2xl flex justify-between">{title}</div>
            {!durationIsMonth && discountPercentage > 0 && (
              <Chip
                className="flex text-sm items-center gap-[2px] !border-none"
                color="primary"
                variant="flat"
              >
                <span>Save $ {discountAmount.toFixed(2)}</span>
              </Chip>
            )}
            {/* <span className="font-normal text-white text-opacity-70">
              {description}
            </span> */}
          </div>

          <div className="!border-none flex flex-col gap-0 !m-0 flex-1">
            <div className="!border-none flex gap-2 items-baseline">
              {!durationIsMonth && discountPercentage > 0 && price > 0 && (
                <span className="text-red-500 line-through text-3xl font-normal">
                  ${yearlyPrice}
                </span>
              )}
              <span className="text-5xl">${finalPrice}</span>
              <span className="text-2xl">USD</span>
            </div>

            <span className="font-normal text-sm text-white text-opacity-70">
              {durationIsMonth ? "/ per month" : "/ per year"}
            </span>
          </div>

          <div className="flex flex-col gap-1 mt-1">
            {featurestitle}

            {!!features &&
              features.map((feature: string, index: number) => (
                <div
                  key={index}
                  className="text-sm font-normal flex items-center gap-3 !border-none"
                >
                  <Tick02Icon
                    height="20"
                    width="20"
                    className="min-w-[20px] min-h-[20px]"
                  />
                  {feature}
                </div>
              ))}
          </div>

          <Button
            className="w-full font-medium"
            color="primary"
            variant={type === "main" ? "shadow" : "flat"}
          >
            Get started
          </Button>
        </div>
      </div>
    </>
  );
}
