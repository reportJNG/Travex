import { useId } from "react";
import { cn } from "@/lib/utils";

type LogoTone = "default" | "light" | "mono";

type TravexLogoIconProps = {
  className?: string;
  tone?: LogoTone;
  decorative?: boolean;
};

export function TravexLogoIcon({
  className,
  tone = "default",
  decorative = true,
}: TravexLogoIconProps) {
  const rawId = useId().replace(/:/g, "");
  const topGradient = `travex-top-${rawId}`;
  const leftGradient = `travex-left-${rawId}`;
  const rightGradient = `travex-right-${rawId}`;
  const routeColor = tone === "light" ? "#ffffff" : "#222c4f";
  const mono = tone === "mono";

  return (
    <svg
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "Travex"}
      role={decorative ? undefined : "img"}
    >
      <defs>
        <linearGradient
          id={topGradient}
          x1="68"
          y1="22"
          x2="170"
          y2="115"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            stopColor={mono ? routeColor : "#5ab89e"}
            stopOpacity={mono ? 0.16 : 1}
          />
          <stop
            offset="0.48"
            stopColor={mono ? routeColor : "#5e9ccd"}
            stopOpacity={mono ? 0.16 : 1}
          />
          <stop
            offset="1"
            stopColor={mono ? routeColor : "#9c72be"}
            stopOpacity={mono ? 0.16 : 1}
          />
        </linearGradient>
        <linearGradient
          id={leftGradient}
          x1="18"
          y1="144"
          x2="115"
          y2="236"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            stopColor={mono ? routeColor : "#76c899"}
            stopOpacity={mono ? 0.16 : 1}
          />
          <stop
            offset="0.52"
            stopColor={mono ? routeColor : "#54b0a4"}
            stopOpacity={mono ? 0.16 : 1}
          />
          <stop
            offset="1"
            stopColor={mono ? routeColor : "#5e9ccd"}
            stopOpacity={mono ? 0.16 : 1}
          />
        </linearGradient>
        <linearGradient
          id={rightGradient}
          x1="147"
          y1="144"
          x2="242"
          y2="235"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            stopColor={mono ? routeColor : "#f5c07e"}
            stopOpacity={mono ? 0.16 : 1}
          />
          <stop
            offset="0.52"
            stopColor={mono ? routeColor : "#f3996e"}
            stopOpacity={mono ? 0.16 : 1}
          />
          <stop
            offset="1"
            stopColor={mono ? routeColor : "#d46799"}
            stopOpacity={mono ? 0.16 : 1}
          />
        </linearGradient>
      </defs>
      <circle cx="128" cy="61" r="46" fill={`url(#${topGradient})`} />
      <circle cx="63" cy="191" r="46" fill={`url(#${leftGradient})`} />
      <circle cx="193" cy="191" r="46" fill={`url(#${rightGradient})`} />
      <path
        d="M128 51 207 205H49L128 51Z"
        stroke={routeColor}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type TravexLogotypeProps = {
  className?: string;
  iconClassName?: string;
  tone?: LogoTone;
  showTagline?: boolean;
};

export function TravexLogotype({
  className,
  iconClassName,
  tone = "default",
  showTagline = false,
}: TravexLogotypeProps) {
  const light = tone === "light";

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <TravexLogoIcon className={cn("h-10 w-10", iconClassName)} tone={tone} />
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate text-lg font-extrabold leading-none tracking-[0.16em]",
            light ? "text-white" : "text-[#222c4f]"
          )}
        >
          TRAVEX
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-1 block truncate text-[0.68rem] font-medium tracking-[0.08em]",
              light ? "text-white/70" : "text-muted-foreground"
            )}
          >
            Travel Excellence
          </span>
        ) : null}
      </span>
    </span>
  );
}
