import React from "react";

type AvatarProps = {
  name: string;
  size?: "sm" | "md";
};

export const Avatar: React.FC<AvatarProps> = ({ name, size = "md" }) => {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const dimension = size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";
  return (
    <span
      className={`flex ${dimension} items-center justify-center rounded-full bg-primary/20 font-semibold text-primary`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
};

