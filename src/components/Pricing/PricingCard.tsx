"use client";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import React from "react";

import { Tick02Icon } from "@/components/Misc/icons";

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
        className={`relative w-full rounded-2xl ${className} ${
          type === "main"
            ? "bg-zinc-900 outline-2 outline-primary"
            : "bg-zinc-900"
        } `}
      >
        <div className="flex h-full flex-col gap-4 p-[7%]">
          <div className="flex flex-row items-center justify-between border-none!">
            <div className="flex justify-between text-2xl">{title}</div>
            {!durationIsMonth && discountPercentage > 0 && (
              <Chip
                className="flex items-center gap-[2px] border-none! text-sm"
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

          <div className="m-0! flex flex-1 flex-col gap-0 border-none!">
            <div className="flex items-baseline gap-2 border-none!">
              {!durationIsMonth && discountPercentage > 0 && price > 0 && (
                <span className="text-3xl font-normal text-red-500 line-through">
                  ${yearlyPrice}
                </span>
              )}
              <span className="text-5xl">${finalPrice}</span>
              <span className="text-2xl">USD</span>
            </div>

            <span className="text-opacity-70 text-sm font-normal text-white">
              {durationIsMonth ? "/ per month" : "/ per year"}
            </span>
          </div>

          <div className="mt-1 flex flex-col gap-1">
            {featurestitle}

            {!!features &&
              features.map((feature: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 border-none! text-sm font-normal"
                >
                  <Tick02Icon
                    height="20"
                    width="20"
                    className="min-h-[20px] min-w-[20px]"
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
