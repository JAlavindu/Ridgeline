export default function CharacterisationCards() {
  const cards = [
    {
      n: "01",
      tag: "SUNLIGHT",
      title: "ILLUMINATION",
      text: "Areas receiving sunlight for longer periods can support power generation.",
    },
    {
      n: "02",
      tag: "TERRAIN",
      title: "SURFACE SAFETY",
      text: "Slope, craters and surface roughness influence whether a spacecraft can land safely.",
    },
    {
      n: "03",
      tag: "RESOURCES",
      title: "WATER ICE",
      text: "Permanently shadowed regions can preserve water ice and other valuable resources.",
    },
    {
      n: "04",
      tag: "ACCESS",
      title: "COMMUNICATION",
      text: "Visibility and access to Earth or relay infrastructure can influence mission reliability.",
    },
  ];

  return (
    <div className="relative z-30">

      {/* ================= CHARACTERISATION CARDS ================= */}

      <div
        className="
          grid
          grid-cols-1
          gap-6

          sm:grid-cols-2
          sm:gap-x-8
          sm:gap-y-7

          lg:grid-cols-4
          lg:gap-6

          xl:gap-8
        "
      >
        {cards.map((c) => (
          <div
            key={c.n}
            className="
              border-t
              border-white/20
              pt-3

              sm:pt-4
            "
          >
            {/* CARD HEADER */}

            <div
              className="
                mb-3

                flex
                items-center
                justify-between

                text-[7px]
                tracking-[2px]
                text-white/40

                sm:text-[8px]
              "
            >
              <span>{c.n}</span>

              <span className="text-[#ff3b12]">
                {c.tag}
              </span>
            </div>

            {/* CARD TITLE */}

            <h3
              className="
                font-['Michroma']
                text-[13px]
                font-light
                text-white

                sm:text-[14px]

                lg:text-[15px]
              "
            >
              {c.title}
            </h3>

            {/* CARD TEXT */}

            <p
              className="
                mt-2

                max-w-[300px]

                text-[9px]
                leading-[1.55]
                text-white/40

                sm:text-[10px]
              "
            >
              {c.text}
            </p>
          </div>
        ))}
      </div>

      {/* ================= CONTINUE ================= */}

      <div
        className="
          mt-10

          text-center

          text-[7px]
          tracking-[3px]
          text-white/30

          sm:mt-12
          sm:text-[8px]
          sm:tracking-[4px]
        "
      >
        CONTINUE EXPLORING

        <span
          className="
            ml-2
            text-[#ff3b12]
          "
        >
          ↓
        </span>
      </div>

    </div>
  );
}