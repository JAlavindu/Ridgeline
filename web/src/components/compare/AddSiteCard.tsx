interface Props {
  onClick: () => void;
}

export default function AddSiteCard({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[430px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/[0.12] bg-white/[0.015] px-6 text-center transition duration-300 hover:border-white/25 hover:bg-white/[0.025]"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.1] text-[24px] font-light text-white/40 transition group-hover:border-white/25 group-hover:text-white">
        +
      </span>

      <span className="mt-5 text-[15px] text-white/65">
        Add landing site
      </span>

      <span className="mt-2 max-w-[190px] text-[11px] leading-5 text-white/30">
        Choose another location to compare its mission conditions.
      </span>
    </button>
  );
}