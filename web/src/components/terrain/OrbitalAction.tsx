type Position =
  | "top"
  | "left"
  | "right"
  | "bottom-left"
  | "bottom-right"
  | "far-left"
  | "far-right";

const positionClasses: Record<
  Position,
  string
> = {
  top:
    "left-1/2 top-[56%] -translate-x-1/2 lg:top-[1%]",

  left:
    "left-[2%] top-[69%] lg:left-[3%] lg:top-[36%]",

  right:
    "right-[2%] top-[69%] lg:right-[3%] lg:top-[36%]",

  "bottom-left":
    "left-[2%] top-[70%] lg:left-[17%] lg:top-auto lg:bottom-[10%]",

  "bottom-right":
    "right-[2%] top-[70%] lg:right-[17%] lg:top-auto lg:bottom-[10%]",

  "far-left":
    "left-[2%] top-[81%] lg:left-[4%] lg:top-[68%]",

  "far-right":
    "right-[2%] top-[81%] lg:right-[4%] lg:top-[68%]",
};

interface OrbitalActionProps {
  position: Position;
  number: string;
  label: string;
  detail: string;
  active?: boolean;
  onClick: () => void;
}

export default function OrbitalAction({
  position,
  number,
  label,
  detail,
  active = false,
  onClick,
}: OrbitalActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        glass-card
        glass-float
        absolute
        z-50
        w-[46%]
        max-w-[190px]
        p-2.5
        text-left
        transition-all
        duration-300
        lg:w-[185px]
        lg:p-4

        ${positionClasses[position]}

        ${
          active
            ? "glass-active -translate-y-1"
            : "hover:-translate-y-1"
        }
      `}
    >

      {/* HEADER */}

      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <span
          className="
            text-[7px]
            tracking-[2px]
            text-white/35
          "
        >
          {number}
        </span>

        <span
          className={`
            h-1.5
            w-1.5
            rounded-full
            ${
              active
                ? "bg-[#ff3b12] shadow-[0_0_8px_rgba(255,59,18,0.8)]"
                : "bg-white/30"
            }
          `}
        />
      </div>

      {/* TITLE */}

      <div
        className="
          mt-3
          font-['Michroma']
          text-[9px]
          tracking-[0.5px]
          md:text-[10px]
        "
      >
        {label}
      </div>

      {/* DESCRIPTION */}

      <div
        className="
          mt-1
          text-[8px]
          leading-[1.5]
          text-white/35
        "
      >
        {detail}
      </div>

    </button>
  );
}