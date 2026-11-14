import { useNavigate } from "react-router-dom";

const teamMembers = [
  {
    id: "M1",
    name: "TEAM MEMBER 01",
    role: "TEAM LEAD",
    fullRole: "Physics & Validation Lead",
    description:
      "Leads the team, owns the scientific scope and formulas, coordinates validation, and ensures the final results are scientifically reliable.",
    skills: ["Physics", "Mathematics", "Validation", "Leadership"],
    image: "/images/team.webp",
  },
  {
    id: "M2",
    name: "TEAM MEMBER 02",
    role: "EPHEMERIS ENGINEER",
    fullRole: "Sun & Earth Geometry",
    description:
      "Builds the SPICE-based ephemeris pipeline and handles Sun and Earth position vectors, browser geometry correctness, and communication calculations.",
    skills: ["SPICE", "Python", "Physics", "Orbital Geometry"],
    image: "/images/team.webp",
  },
  {
    id: "M3",
    name: "TEAM MEMBER 03",
    role: "TERRAIN ENGINEER",
    fullRole: "Terrain & Horizon",
    description:
      "Processes lunar terrain data, generates horizon masks and uncertainty ranges, and works with NASA lunar terrain reference datasets.",
    skills: ["Python", "NumPy", "GIS", "Terrain Analysis"],
    image: "/images/team.webp",
  },
  {
    id: "M4",
    name: "TEAM MEMBER 04",
    role: "VISUALIZATION ENGINEER",
    fullRole: "Scientific Visualization",
    description:
      "Transforms scientific calculations into interactive visual experiences including panoramas, timelines, comparison views, and animations.",
    skills: ["TypeScript", "Charts", "3D", "Visualization"],
    image: "/images/team.webp",
  },
  {
    id: "M5",
    name: "TEAM MEMBER 05",
    role: "APP ENGINEER",
    fullRole: "App & Integration",
    description:
      "Builds and integrates the web application, data loading, geometry engine, site comparison, landing-window finder, and deployment pipeline.",
    skills: ["React", "TypeScript", "Web", "DevOps"],
    image: "/images/team.webp",
  },
  {
    id: "M6",
    name: "TEAM MEMBER 06",
    role: "PRODUCT & UX",
    fullRole: "Product, UX & Presentation Lead",
    description:
      "Shapes the user experience, site catalogue, product story, documentation, presentation, testing, and final project communication.",
    skills: ["UX", "Research", "Design", "Communication"],
    image: "/images/team.webp",
  },
];

export default function TeamPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen overflow-hidden bg-[#020202] text-white">

      {/* =====================================================
          BACKGROUND GRID
      ===================================================== */}

      <div
        className="
          pointer-events-none
          fixed
          inset-0
          z-0
          opacity-[0.06]
          bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)]
          bg-[size:80px_80px]
        "
      />

      {/* =====================================================
          TOP HEADER
      ===================================================== */}

      <header
        className="
          relative
          z-10
          flex
          items-center
          justify-between
          px-6
          py-7
          md:px-[7.5vw]
          md:py-8
        "
      >
        {/* Logo */}

        <button
          type="button"
          onClick={() => navigate("/")}
          className="
            font-['Michroma']
            text-[12px]
            tracking-[3px]
            text-white
            transition-colors
            duration-300
            hover:text-[#ff3b12]
          "
        >
          LUNA
          <span className="ml-1 text-white/35">
            SPACE
          </span>
        </button>

        {/* University */}

        <div
          className="
            hidden
            text-right
            text-[8px]
            uppercase
            tracking-[4px]
            text-white/30
            md:block
          "
        >
          UNIVERSITY OF
          <br />
          SRI JAYEWARDENEPURA
        </div>
      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="
          relative
          z-10
          px-6
          pb-20
          pt-16
          md:px-[7.5vw]
          md:pb-28
          md:pt-24
        "
      >
        {/* Label */}

        <div
          className="
            mb-8
            flex
            items-center
            gap-4
          "
        >
          <span
            className="
              h-px
              w-10
              bg-[#ff3b12]
            "
          />

          <span
            className="
              text-[8px]
              uppercase
              tracking-[5px]
              text-white/40
            "
          >
            THE CREW
          </span>
        </div>


        {/* Heading */}

        <h1
          className="
            max-w-[1100px]
            font-['Michroma']
            text-[clamp(48px,9vw,145px)]
            font-light
            uppercase
            leading-[0.82]
            tracking-[-5px]
          "
        >
          SIX MINDS.
          <br />

          <span className="text-white/25">
            ONE MOON.
          </span>
        </h1>


        {/* Description */}

        <div
          className="
            mt-12
            max-w-xl
            md:ml-[16vw]
          "
        >
          <p
            className="
              text-sm
              leading-7
              text-white/50
            "
          >
            We are a six-member team from the{" "}
            <span className="text-white">
              University of Sri Jayewardenepura
            </span>
            , representing our university at the
            NASA Space Apps Challenge 2026.
          </p>

          <p
            className="
              mt-5
              text-sm
              leading-7
              text-white/35
            "
          >
            Bringing together physics, planetary
            science, terrain analysis, software
            engineering, visualization and product
            design to create an interactive lunar
            exploration experience.
          </p>
        </div>
      </section>


      {/* =====================================================
          UNIVERSITY STRIP
      ===================================================== */}

      <section
        className="
          relative
          z-10
          border-y
          border-white/10
          px-6
          py-6
          md:px-[7.5vw]
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div
            className="
              font-['Michroma']
              text-[10px]
              tracking-[2px]
              text-white/70
            "
          >
            UNIVERSITY OF SRI JAYEWARDENEPURA
          </div>

          <div
            className="
              text-[8px]
              uppercase
              tracking-[3px]
              text-white/25
            "
          >
            NASA SPACE APPS CHALLENGE · 2026
          </div>
        </div>
      </section>


      {/* =====================================================
          TEAM MEMBERS
      ===================================================== */}

      <section
        className="
          relative
          z-10
          px-6
          py-20
          md:px-[7.5vw]
          md:py-28
        "
      >
        {/* Soft colour glows behind the cards, so the glass has something to show through */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[8%] top-[18%] h-[420px] w-[420px] rounded-full bg-[#ff3b12]/[0.14] blur-[120px]" />
          <div className="absolute right-[6%] top-[45%] h-[380px] w-[380px] rounded-full bg-white/[0.06] blur-[120px]" />
          <div className="absolute bottom-[5%] left-[40%] h-[320px] w-[320px] rounded-full bg-[#ff3b12]/[0.08] blur-[110px]" />
        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-5
            md:grid-cols-2
            lg:grid-cols-3
          "
        >
          {teamMembers.map((member) => (
            <article
              key={member.id}
              className="
                glass-card
                glass-float
                group
                relative
                min-h-[560px]
                overflow-hidden
                rounded-3xl
                transition-transform
                duration-500
                hover:-translate-y-1
              "
            >

              {/* =============================================
                  IMAGE
              ============================================= */}

              <div
                className="
                  relative
                  h-[320px]
                  overflow-hidden
                  bg-[#080808]
                "
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="
                    absolute
                    inset-0
                    h-full
                    w-full
                    object-cover
                    grayscale
                    opacity-70
                    transition-all
                    duration-700
                    group-hover:scale-105
                    group-hover:grayscale-0
                    group-hover:opacity-100
                  "
                />

                {/* Dark gradient */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-[#030303]
                    via-transparent
                    to-transparent
                  "
                />

                {/* Member number */}

                <div
                  className="
                    absolute
                    left-5
                    top-5
                    font-['Michroma']
                    text-[9px]
                    tracking-[2px]
                    text-[#ff3b12]
                  "
                >
                  {member.id}
                </div>

                {/* Corner */}

                <div
                  className="
                    absolute
                    right-5
                    top-5
                    text-[16px]
                    text-white/20
                    transition-colors
                    duration-300
                    group-hover:text-[#ff3b12]
                  "
                >
                  ↗
                </div>
              </div>


              {/* =============================================
                  MEMBER INFORMATION
              ============================================= */}

              <div className="p-6">

                {/* Role */}

                <div
                  className="
                    mb-3
                    text-[8px]
                    uppercase
                    tracking-[3px]
                    text-[#ff3b12]
                  "
                >
                  {member.role}
                </div>


                {/* Name */}

                <h2
                  className="
                    font-['Michroma']
                    text-[21px]
                    font-light
                    uppercase
                    tracking-[-1px]
                  "
                >
                  {member.name}
                </h2>


                {/* Full Role */}

                <p
                  className="
                    mt-2
                    text-[8px]
                    uppercase
                    tracking-[2px]
                    text-white/30
                  "
                >
                  {member.fullRole}
                </p>


                {/* Description */}

                <p
                  className="
                    mt-6
                    min-h-[96px]
                    text-[12px]
                    leading-6
                    text-white/45
                  "
                >
                  {member.description}
                </p>


                {/* Skills */}

                <div
                  className="
                    mt-6
                    flex
                    flex-wrap
                    gap-2
                  "
                >
                  {member.skills.map((skill) => (
                    <span
                      key={skill}
                      className="
                        glass-chip
                        px-3
                        py-1.5
                        text-[7px]
                        uppercase
                        tracking-[1.5px]
                        text-white/40
                        group-hover:text-white/60
                      "
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>


              {/* =============================================
                  HOVER CORNER
              ============================================= */}

              <div
                className="
                  pointer-events-none
                  absolute
                  bottom-0
                  right-0
                  h-12
                  w-12
                  border-l
                  border-t
                  border-[#ff3b12]/30
                  opacity-0
                  transition-opacity
                  duration-500
                  group-hover:opacity-100
                "
              />

            </article>
          ))}
        </div>
      </section>


      {/* =====================================================
          TEAM PHILOSOPHY
      ===================================================== */}

      <section
        className="
          relative
          z-10
          border-t
          border-white/10
          px-6
          py-24
          md:px-[7.5vw]
          md:py-36
        "
      >
        <div
          className="
            grid
            gap-12
            lg:grid-cols-[0.8fr_1.2fr]
          "
        >

          {/* Left */}

          <div>
            <div
              className="
                text-[8px]
                uppercase
                tracking-[5px]
                text-[#ff3b12]
              "
            >
              OUR APPROACH
            </div>

            <div
              className="
                mt-5
                font-['Michroma']
                text-[11px]
                tracking-[2px]
                text-white/30
              "
            >
              SCIENCE × SOFTWARE × STORY
            </div>
          </div>


          {/* Right */}

          <div>
            <h2
              className="
                max-w-4xl
                font-['Michroma']
                text-[clamp(30px,5vw,70px)]
                font-light
                uppercase
                leading-[0.95]
                tracking-[-2px]
              "
            >
              Turning lunar
              <span className="text-white/30">
                {" "}
                science
              </span>
              <br />
              into something
              <br />
              people can explore.
            </h2>

            <p
              className="
                mt-10
                max-w-2xl
                text-sm
                leading-7
                text-white/40
              "
            >
              Our team combines scientific validation,
              astronomical calculations, lunar terrain
              analysis, software engineering, interactive
              visualization and user experience into one
              exploration platform.
            </p>
          </div>

        </div>
      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        className="
          relative
          z-10
          border-t
          border-white/10
          px-6
          py-8
          md:px-[7.5vw]
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div
            className="
              font-['Michroma']
              text-[9px]
              tracking-[2px]
              text-white/50
            "
          >
            LUNAR LANDING SITE NAVIGATOR
          </div>

          <div
            className="
              text-[8px]
              tracking-[2px]
              text-white/20
            "
          >
            UNIVERSITY OF SRI JAYEWARDENEPURA
          </div>
        </div>
      </footer>

    </main>
  );
}