import React, { memo, useId, type SVGProps } from "react";

const C = {
  lavender: "#786BB0",
  rose: "#AD719E",
  gold: "#D8B27D",
  sage: "#98A265",
  blue: "#556AA8",
} as const;

const sw = 2.0;
const swd = 1.0;

// ─── Shared primitives ────────────────────────────────────────────────────────

function Svg({ children, title, titleId, ...svgProps }: React.PropsWithChildren<Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }>) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%" }}
      aria-hidden={title ? undefined : true}
      aria-labelledby={title ? titleId : undefined}
      role="img"
      {...svgProps}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {children}
    </svg>
  );
}

function BookPages({
  color,
  yTop = 94,
  yBot = 145,
  xOuter = 22,
  textLines = 4,
}: {
  color: string;
  yTop?: number;
  yBot?: number;
  xOuter?: number;
  textLines?: number;
}) {
  const xRight = 200 - xOuter;
  return (
    <>
      <path
        d={`M100 ${yBot} C82 ${yBot - 5} ${xOuter + 26} ${yBot - 12} ${xOuter} ${yBot - 14} L${xOuter} ${yTop - 14} C${xOuter + 26} ${yTop - 12} 82 ${yTop - 6} 100 ${yTop}`}
        stroke={color}
        strokeWidth={sw}
      />
      <path
        d={`M100 ${yBot} C118 ${yBot - 5} ${xRight - 26} ${yBot - 12} ${xRight} ${yBot - 14} L${xRight} ${yTop - 14} C${xRight - 26} ${yTop - 12} 118 ${yTop - 6} 100 ${yTop}`}
        stroke={color}
        strokeWidth={sw}
      />
      <line x1="100" y1={yTop} x2="100" y2={yBot} stroke={color} strokeWidth={sw} />
      {Array.from({ length: textLines }).map((_, i) => (
        <React.Fragment key={i}>
          <line x1={xOuter + 8} y1={yTop + 6 + i * 10} x2={93} y2={yTop + 12 + i * 10} stroke={color} strokeWidth={swd} opacity={0.38} />
          <line x1={xRight - 8} y1={yTop + 6 + i * 10} x2={107} y2={yTop + 12 + i * 10} stroke={color} strokeWidth={swd} opacity={0.38} />
        </React.Fragment>
      ))}
    </>
  );
}

// ─── Emotional Language Collection ────────────────────────────────────────────

// An underlined passage with concentric annotation circles radiating outward
const Resonance = memo(function Resonance(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      <BookPages color={C.lavender} yTop={94} yBot={146} xOuter={22} textLines={3} />
      {/* fourth text line — this is the marked passage */}
      <line x1="30" y1="130" x2="88" y2="134" stroke={C.lavender} strokeWidth={1.05} opacity={0.66} />
      {/* underline stroke */}
      <line x1="30" y1="134" x2="76" y2="138" stroke={C.lavender} strokeWidth={sw} opacity={0.88} />
      {/* concentric annotation halos, centered on the underline midpoint */}
      <ellipse cx="53" cy="135" rx="15" ry="5.5" stroke={C.lavender} strokeWidth={swd} opacity={0.52} />
      <ellipse cx="53" cy="135" rx="30" ry="11" stroke={C.lavender} strokeWidth={swd} opacity={0.30} />
      <ellipse cx="53" cy="135" rx="46" ry="17" stroke={C.lavender} strokeWidth={swd} opacity={0.15} />
    </Svg>
  );
});

// Open book with a long ribbon bookmark drifting gracefully
const Swoon = memo(function Swoon(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      {/* Book — positioned slightly higher to let ribbon trail below */}
      <path d="M100 140 C84 136 52 130 28 128 L28 76 C52 78 84 84 100 90" stroke={C.lavender} strokeWidth={sw} />
      <path d="M100 140 C116 136 148 130 172 128 L172 76 C148 78 116 84 100 90" stroke={C.lavender} strokeWidth={sw} />
      <line x1="100" y1="90" x2="100" y2="140" stroke={C.lavender} strokeWidth={sw} />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={36} y1={86 + i * 11} x2={93} y2={90 + i * 11} stroke={C.lavender} strokeWidth={swd} opacity={0.32} />
      ))}
      {[0, 1, 2].map((i) => (
        <line key={i} x1={164} y1={86 + i * 11} x2={107} y2={90 + i * 11} stroke={C.lavender} strokeWidth={swd} opacity={0.32} />
      ))}
      {/* Ribbon — two parallel curving lines, drift right then curl */}
      <path d="M126 76 C124 95 132 114 128 132 C124 150 120 160 124 174 C127 183 132 186 130 194" stroke={C.rose} strokeWidth={sw} />
      <path d="M132 76 C130 95 138 114 134 132 C130 150 126 160 130 174 C133 183 138 186 136 194" stroke={C.rose} strokeWidth={sw} />
      {/* V-notch at ribbon end */}
      <line x1="130" y1="194" x2="133" y2="188" stroke={C.rose} strokeWidth={sw} />
      <line x1="136" y1="194" x2="133" y2="188" stroke={C.rose} strokeWidth={sw} />
    </Svg>
  );
});

// A torn page carefully repaired with archival tape
const Heartbreak = memo(function Heartbreak(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      {/* Page outline */}
      <rect x="58" y="44" width="84" height="114" rx="2" stroke={C.rose} strokeWidth={sw} />
      {/* Text lines above the tear */}
      {[54, 64, 74, 84].map((y) => (
        <line key={y} x1={68} y1={y} x2={132} y2={y} stroke={C.rose} strokeWidth={swd} opacity={0.25} />
      ))}
      {/* Text lines below the tear */}
      {[120, 130, 140].map((y) => (
        <line key={y} x1={68} y1={y} x2={132} y2={y} stroke={C.rose} strokeWidth={swd} opacity={0.25} />
      ))}
      {/* Torn edge — ragged horizontal path across the middle */}
      <path
        d="M58 102 L66 98 L74 105 L82 100 L90 106 L98 101 L106 106 L114 100 L122 105 L130 101 L138 104 L142 102"
        stroke={C.rose}
        strokeWidth={sw}
      />
      {/* Archival tape strip — three overlapping rectangles at slight angles */}
      <rect x="74" y="93" width="52" height="10" rx="1" stroke={C.rose} strokeWidth={0.82} opacity={0.48} transform="rotate(-7 100 98)" />
      <rect x="80" y="99" width="44" height="8" rx="1" stroke={C.rose} strokeWidth={0.75} opacity={0.34} transform="rotate(4 102 103)" />
      <rect x="86" y="96" width="34" height="9" rx="1" stroke={C.rose} strokeWidth={0.78} opacity={0.40} transform="rotate(-1 103 100)" />
    </Svg>
  );
});

// A moth circling a reading lamp
const DangerousAttraction = memo(function DangerousAttraction(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      {/* Reading lamp */}
      {/* Base */}
      <ellipse cx="118" cy="160" rx="20" ry="7" stroke={C.gold} strokeWidth={sw} />
      {/* Stem */}
      <line x1="118" y1="153" x2="118" y2="120" stroke={C.gold} strokeWidth={sw} />
      {/* Shade — conical, wider at top */}
      <path d="M94 100 L106 120 L130 120 L142 100" stroke={C.gold} strokeWidth={sw} />
      <line x1="94" y1="100" x2="142" y2="100" stroke={C.gold} strokeWidth={sw} />
      {/* Shade inner detail */}
      <line x1="100" y1="104" x2="136" y2="104" stroke={C.gold} strokeWidth={swd} opacity={0.35} />
      {/* Moth — upper-left, wings spread toward the lamp */}
      {/* Body */}
      <path d="M52 88 C54 82 54 76 52 70" stroke={C.rose} strokeWidth={sw * 0.9} />
      {/* Antennae */}
      <path d="M52 70 C48 64 44 60 46 56" stroke={C.rose} strokeWidth={0.75} />
      <path d="M52 70 C56 64 58 60 56 56" stroke={C.rose} strokeWidth={0.75} />
      {/* Upper wings */}
      <path d="M52 84 C40 74 32 78 34 86 C36 92 48 90 52 86" stroke={C.rose} strokeWidth={sw} />
      <path d="M52 84 C58 72 66 68 70 74 C72 82 62 88 56 86" stroke={C.rose} strokeWidth={sw} />
      {/* Lower wings */}
      <path d="M52 86 C40 92 36 100 42 104 C48 106 54 98 54 88" stroke={C.rose} strokeWidth={0.9} opacity={0.70} />
      <path d="M54 86 C64 94 68 102 62 106 C56 108 54 98 54 88" stroke={C.rose} strokeWidth={0.9} opacity={0.70} />
      {/* Circling motion arc — curved dashes from moth toward lamp */}
      <path d="M68 80 C76 72 86 70 92 74" stroke={C.gold} strokeWidth={swd} opacity={0.42} strokeDasharray="3 2.5" />
      <path d="M64 94 C60 104 62 114 70 118" stroke={C.gold} strokeWidth={swd} opacity={0.30} strokeDasharray="3 2.5" />
    </Svg>
  );
});

// A closed book with a small chili pepper elegantly embossed on the cover
const Spice = memo(function Spice(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      {/* Book body — standing portrait */}
      <rect x="64" y="50" width="72" height="100" rx="2" stroke={C.lavender} strokeWidth={sw} />
      {/* Spine edge */}
      <line x1="70" y1="50" x2="70" y2="150" stroke={C.lavender} strokeWidth={swd} opacity={0.42} />
      {/* Cover rule lines — delicate */}
      <line x1="64" y1="68" x2="136" y2="68" stroke={C.lavender} strokeWidth={swd} opacity={0.25} />
      <line x1="64" y1="132" x2="136" y2="132" stroke={C.lavender} strokeWidth={swd} opacity={0.25} />
      {/* Chili pepper — elegant, centered on cover */}
      {/* Pepper body */}
      <path d="M100 85 C96 88 90 95 90 103 C90 111 95 118 100 120 C105 118 110 111 110 103 C110 95 104 88 100 85" stroke={C.rose} strokeWidth={0.95} opacity={0.82} />
      {/* Subtle inner curve */}
      <path d="M100 120 C100 123 101 126 100 129" stroke={C.rose} strokeWidth={0.88} />
      {/* Stem */}
      <path d="M100 85 C100 81 102 78 106 76" stroke={C.rose} strokeWidth={0.9} />
      {/* Leaf */}
      <path d="M101 82 C96 78 90 77 90 73 C95 76 100 78 101 82" stroke={C.lavender} strokeWidth={0.78} opacity={0.62} />
    </Svg>
  );
});

// Open book, crown resting across pages, subtle flame lines behind the crown
const FeminineRage = memo(function FeminineRage(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      {/* Open book */}
      <path d="M100 150 C84 146 52 140 26 138 L26 84 C52 86 84 92 100 98" stroke={C.lavender} strokeWidth={sw} />
      <path d="M100 150 C116 146 148 140 174 138 L174 84 C148 86 116 92 100 98" stroke={C.lavender} strokeWidth={sw} />
      <line x1="100" y1="98" x2="100" y2="150" stroke={C.lavender} strokeWidth={sw} />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={34} y1={104 + i * 12} x2={93} y2={108 + i * 12} stroke={C.lavender} strokeWidth={swd} opacity={0.28} />
      ))}
      {[0, 1, 2].map((i) => (
        <line key={i} x1={166} y1={104 + i * 12} x2={107} y2={108 + i * 12} stroke={C.lavender} strokeWidth={swd} opacity={0.28} />
      ))}
      {/* Flame lines rising — very subtle, behind the crown */}
      <path d="M88 88 C86 82 88 76 85 70" stroke={C.rose} strokeWidth={0.85} opacity={0.52} />
      <path d="M100 84 C98 77 100 70 97 63" stroke={C.rose} strokeWidth={0.9} opacity={0.56} />
      <path d="M112 88 C114 82 112 76 115 70" stroke={C.rose} strokeWidth={0.85} opacity={0.52} />
      <path d="M93 86 C91 80 93 75 91 69" stroke={C.rose} strokeWidth={0.7} opacity={0.36} />
      <path d="M107 86 C109 80 107 75 109 69" stroke={C.rose} strokeWidth={0.7} opacity={0.36} />
      {/* Crown — resting on open pages */}
      <path d="M72 96 L72 88 L84 94 L100 82 L116 94 L128 88 L128 96 Z" stroke={C.gold} strokeWidth={sw} />
      <line x1="72" y1="96" x2="128" y2="96" stroke={C.gold} strokeWidth={sw} />
      {/* Crown point accents */}
      <circle cx="72" cy="88" r="1.6" stroke={C.gold} strokeWidth={0.82} />
      <circle cx="100" cy="82" r="2.0" stroke={C.gold} strokeWidth={0.82} />
      <circle cx="128" cy="88" r="1.6" stroke={C.gold} strokeWidth={0.82} />
    </Svg>
  );
});

// A growing stack of books overflowing with bookmarks
const Obsession = memo(function Obsession(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      {/* Stack of 4 books — horizontal, widths narrowing toward top */}
      {/* Bottom book */}
      <rect x="36" y="136" width="128" height="20" rx="2" stroke={C.lavender} strokeWidth={sw} />
      <line x1="36" y1="148" x2="164" y2="148" stroke={C.lavender} strokeWidth={swd} opacity={0.32} />
      {/* 2nd */}
      <rect x="44" y="112" width="112" height="20" rx="2" stroke={C.lavender} strokeWidth={sw} />
      <line x1="44" y1="124" x2="156" y2="124" stroke={C.lavender} strokeWidth={swd} opacity={0.32} />
      {/* 3rd */}
      <rect x="52" y="90" width="96" height="18" rx="2" stroke={C.lavender} strokeWidth={sw} />
      <line x1="52" y1="100" x2="148" y2="100" stroke={C.lavender} strokeWidth={swd} opacity={0.32} />
      {/* 4th — slightly rotated, topmost */}
      <rect x="50" y="70" width="100" height="18" rx="2" stroke={C.lavender} strokeWidth={sw} transform="rotate(-2 100 79)" />
      {/* Bookmarks — protruding in different directions and lengths */}
      {/* Long one, bottom-left, going down */}
      <path d="M58 156 L58 182 L62 175 L66 182 L66 156" stroke={C.rose} strokeWidth={sw} />
      {/* Tall one, 2nd book right side, going up */}
      <path d="M136 112 L136 82 L140 88 L144 82 L144 112" stroke={C.gold} strokeWidth={sw} />
      {/* Short one, 3rd book left, going up */}
      <path d="M68 90 L68 70 L71 75 L74 70 L74 90" stroke={C.lavender} strokeWidth={sw} opacity={0.68} />
      {/* Tall one, top book right */}
      <path d="M126 70 L126 46 L129 52 L132 46 L132 70" stroke={C.lavender} strokeWidth={sw} />
      {/* Medium one, 3rd book right side, going down */}
      <path d="M134 108 L134 128 L137 122 L140 128 L140 108" stroke={C.lavender} strokeWidth={sw} opacity={0.60} />
    </Svg>
  );
});

// Open book where text lines transform into a mountain landscape
const Immersion = memo(function Immersion(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      {/* Open book — soft blue */}
      <path d="M100 152 C84 148 52 142 26 140 L26 86 C52 88 84 94 100 100" stroke={C.blue} strokeWidth={sw} />
      <path d="M100 152 C116 148 148 142 174 140 L174 86 C148 88 116 94 100 100" stroke={C.blue} strokeWidth={sw} />
      <line x1="100" y1="100" x2="100" y2="152" stroke={C.blue} strokeWidth={sw} />
      {/* Right page — normal text lines (literature side) */}
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={166} y1={110 + i * 10} x2={107} y2={114 + i * 10} stroke={C.blue} strokeWidth={swd} opacity={0.30} />
      ))}
      {/* Left page — text lines at bottom fading into landscape at top */}
      {/* Lower text lines — normal */}
      {[0, 1].map((i) => (
        <line key={i} x1={34} y1={134 + i * 10} x2={93} y2={138 + i * 10} stroke={C.blue} strokeWidth={swd} opacity={0.30} />
      ))}
      {/* Fading transitional lines */}
      <line x1="36" y1="122" x2="92" y2="126" stroke={C.blue} strokeWidth={swd} opacity={0.22} />
      <line x1="40" y1="114" x2="90" y2="118" stroke={C.blue} strokeWidth={swd} opacity={0.16} />
      {/* Landscape horizon — text-line density */}
      <path d="M28 110 C40 108 52 106 62 106 C72 106 82 108 93 110" stroke={C.blue} strokeWidth={0.88} opacity={0.52} />
      {/* Mountains emerging from pages */}
      <path d="M32 110 C38 102 44 96 50 90 C56 96 62 102 66 110" stroke={C.blue} strokeWidth={sw} />
      <path d="M54 110 C60 104 66 98 74 92 C80 98 84 104 86 110 C88 110 91 110 93 110" stroke={C.blue} strokeWidth={sw} />
      {/* Distant peak — lighter, suggesting depth */}
      <path d="M44 104 C48 98 52 94 56 90 C60 94 64 98 66 104" stroke={C.blue} strokeWidth={swd} opacity={0.42} />
    </Svg>
  );
});

// Three books of different sizes leaning gently against one another
const Belonging = memo(function Belonging(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      {/* Center book — tallest, upright */}
      <rect x="86" y="58" width="28" height="98" rx="2" stroke={C.lavender} strokeWidth={sw} />
      <line x1="86" y1="76" x2="114" y2="76" stroke={C.lavender} strokeWidth={swd} opacity={0.38} />
      <line x1="86" y1="140" x2="114" y2="140" stroke={C.lavender} strokeWidth={swd} opacity={0.38} />
      {/* Left book — slightly shorter, leaning toward center */}
      <rect x="48" y="72" width="26" height="84" rx="2" stroke={C.sage} strokeWidth={sw} transform="rotate(6 61 114)" />
      <line x1="48" y1="90" x2="74" y2="90" stroke={C.sage} strokeWidth={swd} opacity={0.38} transform="rotate(6 61 114)" />
      {/* Right book — slightly shorter, leaning toward center */}
      <rect x="126" y="72" width="26" height="84" rx="2" stroke={C.blue} strokeWidth={sw} transform="rotate(-6 139 114)" />
      <line x1="126" y1="90" x2="152" y2="90" stroke={C.blue} strokeWidth={swd} opacity={0.38} transform="rotate(-6 139 114)" />
      {/* Shelf baseline */}
      <line x1="40" y1="158" x2="160" y2="158" stroke={C.lavender} strokeWidth={swd} opacity={0.42} />
    </Svg>
  );
});

// A stack of books in different sizes and formats — many voices gathered
const Diversity = memo(function Diversity(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      {/* Bottom flat book — widest */}
      <rect x="30" y="138" width="140" height="17" rx="2" stroke={C.lavender} strokeWidth={sw} />
      <line x1="30" y1="149" x2="170" y2="149" stroke={C.lavender} strokeWidth={swd} opacity={0.30} />
      {/* 2nd flat book */}
      <rect x="38" y="118" width="124" height="17" rx="2" stroke={C.rose} strokeWidth={sw} />
      <line x1="38" y1="129" x2="162" y2="129" stroke={C.rose} strokeWidth={swd} opacity={0.30} />
      {/* 3rd flat book — narrower */}
      <rect x="48" y="100" width="104" height="15" rx="2" stroke={C.gold} strokeWidth={sw} />
      {/* 4th flat book — slight rotation */}
      <rect x="44" y="82" width="92" height="14" rx="2" stroke={C.sage} strokeWidth={sw} transform="rotate(1.5 90 89)" />
      {/* Standing small book on top-right */}
      <rect x="108" y="54" width="20" height="48" rx="2" stroke={C.blue} strokeWidth={sw} />
      <line x1="108" y1="66" x2="128" y2="66" stroke={C.blue} strokeWidth={swd} opacity={0.38} />
      {/* Standing narrow book on top-left — slight lean */}
      <rect x="64" y="44" width="14" height="56" rx="2" stroke={C.lavender} strokeWidth={sw} transform="rotate(-3 71 72)" />
      {/* Spine detail on flat books */}
      <line x1="46" y1="118" x2="46" y2="135" stroke={C.rose} strokeWidth={swd} opacity={0.35} />
      <line x1="58" y1="100" x2="58" y2="115" stroke={C.gold} strokeWidth={swd} opacity={0.35} />
    </Svg>
  );
});

// ─── Navigation Illustration Set ──────────────────────────────────────────────

// Three stacked books — personal library
const NavCollections = memo(function NavCollections(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      <rect x="46" y="114" width="108" height="28" rx="2" stroke={C.lavender} />
      <line x1="46" y1="128" x2="154" y2="128" stroke={C.lavender} opacity={0.35} />
      <rect x="52" y="82" width="96" height="28" rx="2" stroke={C.lavender} />
      <line x1="52" y1="96" x2="148" y2="96" stroke={C.lavender} opacity={0.35} />
      <rect x="58" y="52" width="84" height="26" rx="2" stroke={C.lavender} />
      <line x1="58" y1="65" x2="142" y2="65" stroke={C.lavender} opacity={0.35} />
    </Svg>
  );
});

// Small bookshelf with several books, one slightly leaning — curated collections
const NavKases = memo(function NavKases(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      {/* Shelf board */}
      <line x1="34" y1="150" x2="166" y2="150" stroke={C.rose} />
      {/* Side supports */}
      <line x1="34" y1="56" x2="34" y2="150" stroke={C.rose} />
      <line x1="166" y1="56" x2="166" y2="150" stroke={C.rose} />
      {/* Three books spaced evenly across shelf */}
      <rect x="55" y="66" width="18" height="84" rx="1.5" stroke={C.lavender} />
      <rect x="94" y="80" width="14" height="70" rx="1.5" stroke={C.rose} />
      <rect x="129" y="74" width="16" height="76" rx="1.5" stroke={C.lavender} transform="rotate(7 137 112)" />
    </Svg>
  );
});

// Three matching volumes — reading order
const NavSeries = memo(function NavSeries(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      {/* Three identical volumes */}
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          <rect x={48 + i * 38} y="62" width="28" height="90" rx="2" stroke={C.gold} strokeWidth={sw} />
          <line x1={48 + i * 38} y1="80" x2={76 + i * 38} y2="80" stroke={C.gold} strokeWidth={swd} opacity={0.40} />
          <line x1={48 + i * 38} y1="136" x2={76 + i * 38} y2="136" stroke={C.gold} strokeWidth={swd} opacity={0.40} />
        </React.Fragment>
      ))}
      {/* Roman numerals I, II, III suggested by subtle strokes */}
      <line x1="60" y1="105" x2="64" y2="105" stroke={C.gold} strokeWidth={swd} opacity={0.55} />
      <line x1="95" y1="105" x2="99" y2="105" stroke={C.gold} strokeWidth={swd} opacity={0.55} />
      <line x1="99" y1="105" x2="103" y2="105" stroke={C.gold} strokeWidth={swd} opacity={0.55} />
      <line x1="131" y1="105" x2="135" y2="105" stroke={C.gold} strokeWidth={swd} opacity={0.55} />
      <line x1="135" y1="105" x2="139" y2="105" stroke={C.gold} strokeWidth={swd} opacity={0.55} />
      <line x1="139" y1="105" x2="143" y2="105" stroke={C.gold} strokeWidth={swd} opacity={0.55} />
    </Svg>
  );
});

// Elegant fountain pen — creators and voices
const NavAuthors = memo(function NavAuthors(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      {/* Pen barrel — two parallel diagonal lines at ~45° */}
      <path d="M76 62 L134 120" stroke={C.blue} strokeWidth={sw} />
      <path d="M62 76 L120 134" stroke={C.blue} strokeWidth={sw} />
      {/* Cap end — rounded arc at upper-left */}
      <path d="M62 76 C60 68 68 60 76 62" stroke={C.blue} strokeWidth={sw} />
      {/* Clip on cap */}
      <path d="M68 70 C60 78 58 80 60 84" stroke={C.blue} strokeWidth={swd} opacity={0.52} />
      {/* Section / grip band */}
      <line x1="114" y1="128" x2="128" y2="114" stroke={C.blue} strokeWidth={sw * 1.2} opacity={0.42} />
      {/* Nib — triangular tip at lower-right */}
      <path d="M120 134 L134 120 L144 144 Z" stroke={C.blue} strokeWidth={sw} />
      {/* Nib slit */}
      <line x1="127" y1="127" x2="144" y2="144" stroke={C.blue} strokeWidth={swd} opacity={0.50} />
      {/* Small ink drop */}
      <ellipse cx="150" cy="152" rx="4" ry="3" stroke={C.blue} strokeWidth={0.85} opacity={0.55} transform="rotate(45 150 152)" />
    </Svg>
  );
});

// Folded paper map with a dotted route — reading journeys
const NavMaps = memo(function NavMaps(props: Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & { title?: string; titleId?: string }) {
  return (
    <Svg {...props}>
      {/* Map outline */}
      <rect x="34" y="68" width="132" height="88" rx="2" stroke={C.sage} strokeWidth={sw} />
      {/* Fold lines */}
      <line x1="78" y1="68" x2="78" y2="156" stroke={C.sage} strokeWidth={swd} opacity={0.42} />
      <line x1="122" y1="68" x2="122" y2="156" stroke={C.sage} strokeWidth={swd} opacity={0.42} />
      <line x1="34" y1="112" x2="166" y2="112" stroke={C.sage} strokeWidth={swd} opacity={0.32} />
      {/* Route line — dotted path across the map */}
      <path
        d="M44 134 C52 124 62 126 72 118 C82 110 88 100 96 96 C104 92 112 98 120 94 C128 90 136 82 152 78"
        stroke={C.sage}
        strokeWidth={sw}
        strokeDasharray="3.5 3"
      />
      {/* Start marker */}
      <circle cx="44" cy="134" r="2.8" stroke={C.sage} strokeWidth={0.92} />
      {/* End marker */}
      <circle cx="152" cy="78" r="2.8" stroke={C.sage} strokeWidth={0.92} />
      {/* Subtle contour lines — suggest topography */}
      <path d="M88 128 C94 124 100 122 106 124" stroke={C.sage} strokeWidth={swd} opacity={0.30} />
      <path d="M86 136 C94 132 102 130 110 132" stroke={C.sage} strokeWidth={swd} opacity={0.26} />
    </Svg>
  );
});

// ─── Registry & exports ────────────────────────────────────────────────────────

export type EmotionalLanguageId =
  | "resonance"
  | "swoon"
  | "heartbreak"
  | "dangerous-attraction"
  | "spice"
  | "feminine-rage"
  | "obsession"
  | "immersion"
  | "belonging"
  | "diversity";

export type NavArtifactId =
  | "nav-collections"
  | "nav-kases"
  | "nav-series"
  | "nav-authors"
  | "nav-maps";

export type ExpansionArtifactId = EmotionalLanguageId | NavArtifactId;

export const EMOTIONAL_LANGUAGE_IDS: EmotionalLanguageId[] = [
  "resonance",
  "swoon",
  "heartbreak",
  "dangerous-attraction",
  "spice",
  "feminine-rage",
  "obsession",
  "immersion",
  "belonging",
  "diversity",
];

export const NAV_ARTIFACT_IDS: NavArtifactId[] = [
  "nav-collections",
  "nav-kases",
  "nav-series",
  "nav-authors",
  "nav-maps",
];

type ArtifactMeta = { name: string; subtitle: string; palette: string };

export const EMOTIONAL_LANGUAGE_METADATA: Record<EmotionalLanguageId, ArtifactMeta> = {
  resonance: { name: "Resonance", subtitle: "A passage that echoes", palette: "Lavender" },
  swoon: { name: "Swoon", subtitle: "A story carried close", palette: "Rose · Lavender" },
  heartbreak: { name: "Heartbreak", subtitle: "A story that left a mark", palette: "Rose" },
  "dangerous-attraction": { name: "Dangerous Attraction", subtitle: "Irresistible pull", palette: "Gold · Rose" },
  spice: { name: "Spice", subtitle: "Elegant heat", palette: "Lavender · Rose" },
  "feminine-rage": { name: "Feminine Rage", subtitle: "Power reclaimed", palette: "Lavender · Gold · Rose" },
  obsession: { name: "Obsession", subtitle: "One more chapter", palette: "Lavender" },
  immersion: { name: "Immersion", subtitle: "Complete absorption", palette: "Soft Blue" },
  belonging: { name: "Belonging", subtitle: "Found family", palette: "Lavender · Sage · Soft Blue" },
  diversity: { name: "Diversity", subtitle: "Many stories gathered", palette: "All" },
};

export const NAV_ARTIFACT_METADATA: Record<NavArtifactId, ArtifactMeta> = {
  "nav-collections": { name: "Collections", subtitle: "Personal library", palette: "Lavender" },
  "nav-kases": { name: "Kases", subtitle: "Curated collections", palette: "Rose · Lavender" },
  "nav-series": { name: "Series", subtitle: "Reading order", palette: "Gold" },
  "nav-authors": { name: "Authors", subtitle: "Creators and voices", palette: "Soft Blue" },
  "nav-maps": { name: "Maps", subtitle: "Reading journeys", palette: "Sage" },
};

type IllustrationProps = Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & {
  title?: string;
  titleId?: string;
};

const EXPANSION_REGISTRY: Record<ExpansionArtifactId, React.ComponentType<IllustrationProps>> = {
  resonance: Resonance,
  swoon: Swoon,
  heartbreak: Heartbreak,
  "dangerous-attraction": DangerousAttraction,
  spice: Spice,
  "feminine-rage": FeminineRage,
  obsession: Obsession,
  immersion: Immersion,
  belonging: Belonging,
  diversity: Diversity,
  "nav-collections": NavCollections,
  "nav-kases": NavKases,
  "nav-series": NavSeries,
  "nav-authors": NavAuthors,
  "nav-maps": NavMaps,
};

export type ExpansionIconProps = Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & {
  id: ExpansionArtifactId;
  title?: string;
};

export const ExpansionArtifactIcon = memo(function ExpansionArtifactIcon({
  id,
  title,
  className,
  ...svgProps
}: ExpansionIconProps) {
  const titleId = useId();
  const Component = EXPANSION_REGISTRY[id];
  return <Component {...svgProps} className={className} title={title} titleId={title ? titleId : undefined} />;
});

export default ExpansionArtifactIcon;

// ─── Legacy ID mapping ─────────────────────────────────────────────────────────

const OLD_TO_NEW_EMOTIONAL_ID: Record<string, ExpansionArtifactId> = {
  resonance: "resonance",
  ember: "spice",
  emotionalDamage: "heartbreak",
  dangerousAttraction: "dangerous-attraction",
  diversity: "diversity",
  feminineRage: "feminine-rage",
  immersion: "immersion",
  obsession: "obsession",
  belonging: "belonging",
  atmosphere: "immersion",
  comfort: "belonging",
};

export function mapEmotionalId(id: string): ExpansionArtifactId {
  return OLD_TO_NEW_EMOTIONAL_ID[id] ?? "resonance";
}
