import { useState, useRef } from "react";

const SHIRTS = [
  { id: "GK",  label: "Goalkeeper",       number: 1  },
  { id: "RB",  label: "Right Back",       number: 2  },
  { id: "CB",  label: "Centre Back",      number: 5  },
  { id: "CB2", label: "Centre Back",      number: 6  },
  { id: "LB",  label: "Left Back",        number: 3  },
  { id: "RWB", label: "Right Wing Back",  number: 2  },
  { id: "LWB", label: "Left Wing Back",   number: 3  },
  { id: "CDM", label: "Defensive Mid",    number: 4  },
  { id: "CM",  label: "Central Mid",      number: 8  },
  { id: "RM",  label: "Right Mid",        number: 7  },
  { id: "LM",  label: "Left Mid",         number: 11 },
  { id: "CAM", label: "Attacking Mid",    number: 10 },
  { id: "RW",  label: "Right Wing",       number: 7  },
  { id: "LW",  label: "Left Wing",        number: 11 },
  { id: "CF",  label: "Centre Forward",   number: 9  },
  { id: "ST",  label: "Striker",          number: 9  },
  { id: "SS",  label: "Second Striker",   number: 10 },
];

const ZONES = [
  { label: "GK",  ids: ["GK"],                              color: "#FFB800" },
  { label: "DEF", ids: ["RB","CB","CB2","LB","RWB","LWB"],  color: "#4A9EFF" },
  { label: "MID", ids: ["CDM","CM","RM","LM","CAM"],        color: "#00FF87" },
  { label: "ATT", ids: ["RW","LW","CF","ST","SS"],          color: "#FF5C5C" },
];

function getZoneColor(id) {
  return ZONES.find(z => z.ids.includes(id))?.color ?? "#fff";
}

const SHIRT_PATH = "M142.503 2.47149L183.608 16.1731C193.413 19.4415 200 28.5807 200 38.9154V72.3484C200 73.6731 199.194 74.8639 197.964 75.3559L196.545 75.9235V89.6251C196.545 90.9498 195.738 92.1406 194.508 92.6326L165.446 104.258V196.743C165.446 198.532 163.995 199.983 162.206 199.983H37.7937C36.0047 199.983 34.5542 198.532 34.5542 196.743V104.258L5.49153 92.6326C4.26183 92.1411 3.45543 90.9498 3.45543 89.6251V75.9235L2.03611 75.3555C0.80641 74.8639 0 73.6727 0 72.348V38.9154C0 28.5807 6.5869 19.4415 16.3917 16.1731L57.4974 2.47149C62.4171 0.831462 67.541 0 72.7268 0H127.273C132.459 0 137.583 0.831894 142.503 2.47149ZM100 6.47849C99.997 6.47849 99.9944 6.47892 99.9914 6.47892H77.1419L90.2436 27.6434H109.739L122.841 6.47892H100.009C100.006 6.47892 100.003 6.47849 100 6.47849ZM9.93435 78.5146V87.4318L34.5542 97.2797V88.3626L9.93435 78.5146ZM165.446 97.2797L190.066 87.4318V78.5146L165.446 88.3626V97.2797ZM61.8325 8.26316C61.5469 8.34171 61.2688 8.41819 61 8.49133L68 20.4913L62.9147 22.0646L22.811 35.4324C21.3092 35.933 20.3006 37.3324 20.3006 38.9154V62.9902C20.3006 64.7793 18.8502 66.2297 17.0612 66.2297C15.2721 66.2297 13.8217 64.7793 13.8217 62.9902V38.9154C13.8217 34.5391 16.6111 30.6695 20.7624 29.2856L59.4104 16.4033L55.4384 9.98747L18.4403 22.3199C11.2859 24.705 6.47892 31.374 6.47892 38.9154V70.1546L34.5542 81.3848V55.0708C34.5542 53.2818 36.0047 51.8314 37.7937 51.8314C39.5828 51.8314 41.0332 53.2818 41.0332 55.0708V86.104V86.1144V101.999V102.009V193.504H158.967V102.01V102V86.1152V86.1049V55.0717C158.967 53.2827 160.417 51.8322 162.206 51.8322C163.995 51.8322 165.446 53.2827 165.446 55.0717V81.3856L193.521 70.1555V38.9159C193.521 31.3744 188.714 24.705 181.56 22.3203L144.548 9.98315L140.576 16.399L179.238 29.286C183.389 30.6695 186.178 34.5396 186.178 38.9154V62.9902C186.178 64.7793 184.728 66.2297 182.939 66.2297C181.15 66.2297 179.699 64.7793 179.699 62.9902V38.9154C179.699 37.3324 178.691 35.933 177.189 35.4324L137.071 22.0599L132 20.4913L139 7.99133C136.444 7.29679 133.026 6.79552 130.387 6.59857L114.299 32.5877C113.708 33.5414 112.666 34.1219 111.544 34.1219H88.4394C87.3177 34.1219 86.2755 33.5414 85.685 32.5877L69.597 6.59986C67.2359 6.77726 64.2627 7.59488 61.8325 8.26316Z";

function ShirtSVG({ color, selected, number }) {
  const fill = selected ? color : "rgba(255,255,255,0.12)";
  const numColor = selected ? "#fff" : "rgba(255,255,255,0.3)";
  const glow = selected
    ? `drop-shadow(0 0 14px ${color}80) drop-shadow(0 0 28px ${color}30)`
    : "none";

  return (
    <svg
      viewBox="0 0 200 200"
      width="76"
      height="76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", filter: glow, transition: "filter 0.2s ease", overflow: "visible" }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={SHIRT_PATH}
        fill={fill}
        style={{ transition: "fill 0.2s ease" }}
      />
      {/* Squad number */}
      <text
        x="100" y="145"
        textAnchor="middle"
        fontFamily="'Anton', sans-serif"
        fontSize="72"
        fill={numColor}
        style={{ transition: "fill 0.2s ease" }}
      >
        {number}
      </text>
    </svg>
  );
}

export default function ShirtRack() {
  const [selected, setSelected]     = useState(new Set());
  const railRef                     = useRef(null);
  const [dragging, setDragging]     = useState(false);
  const [startX, setStartX]         = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size >= 3) return prev;
      next.add(id);
      return next;
    });
  };

  const onMouseDown = (e) => {
    setDragging(true);
    setStartX(e.pageX - railRef.current.offsetLeft);
    setScrollLeft(railRef.current.scrollLeft);
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    const x = e.pageX - railRef.current.offsetLeft;
    railRef.current.scrollLeft = scrollLeft - (x - startX);
  };
  const onMouseUp = () => setDragging(false);

  const selectedList = SHIRTS.filter(s => selected.has(s.id));

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0F1E",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 0",
      fontFamily: "'Barlow Condensed', sans-serif",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Anton&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .shirt-item {
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 96px;
          padding-bottom: 8px;
        }
        .shirt-item.is-disabled {
          opacity: 0.2;
          cursor: not-allowed;
          pointer-events: none;
        }

        .rail::-webkit-scrollbar { display: none; }
        .rail { -ms-overflow-style: none; scrollbar-width: none; }

        .hanger-wire {
          width: 1.5px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(255,255,255,0.05));
          margin: 0 auto;
        }
        .hanger-hook {
          width: 12px;
          height: 7px;
          border: 1.5px solid rgba(255,255,255,0.15);
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          margin: 0 auto;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        .pill {
          animation: slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards;
          cursor: pointer;
        }
        .pill:hover { opacity: 0.7; }

        .confirm-btn {
          transition: all 0.25s ease;
          cursor: pointer;
          border: none;
          font-family: 'Barlow Condensed', sans-serif;
        }
        .confirm-btn:not(:disabled):hover {
          box-shadow: 0 10px 36px rgba(0,255,135,0.35) !important;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 480, padding: "0 24px" }}>
        <div style={{
          fontSize: 14, color: "rgba(255,255,255,0.4)", letterSpacing: "0.3px",
          textAlign: "center", marginBottom: 36,
        }}>
          Select up to 3 positions — scroll to browse
        </div>
      </div>

      {/* Rack */}
      <div style={{ width: "100%", position: "relative", marginBottom: 40 }}>

        {/* Rail bar */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 2.5,
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.14) 8%, rgba(255,255,255,0.14) 92%, transparent)",
          borderRadius: 2,
          zIndex: 10,
          pointerEvents: "none",
        }} />

        {/* Scrollable rail */}
        <div
          ref={railRef}
          className="rail"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { onMouseUp(); }}
          style={{
            display: "flex",
            gap: 4,
            overflowX: "auto",
            padding: "0 44px 32px",
            paddingTop: 0,
            cursor: dragging ? "grabbing" : "grab",
          }}
        >
          {SHIRTS.map((shirt) => {
            const isSelected = selected.has(shirt.id);
            const isDisabled = !isSelected && selected.size >= 3;
            const color      = getZoneColor(shirt.id);
            const labelColor = isSelected ? color : "rgba(255,255,255,0.4)";

            return (
              <div
                key={shirt.id}
                className={["shirt-item", isDisabled ? "is-disabled" : ""].join(" ")}
                onClick={() => toggle(shirt.id)}
              >
                {/* Hanger */}
                <div className="hanger-hook" />
                <div className="hanger-wire" style={{ height: 18 }} />

                {/* Shirt */}
                <ShirtSVG
                  color={color}
                  selected={isSelected}
                  number={shirt.number}
                />

                {/* Labels */}
                <div style={{ marginTop: 10, textAlign: "center" }}>
                  <div style={{
                    fontSize: 20, fontWeight: 900,
                    color: labelColor,
                    letterSpacing: "1px",
                    lineHeight: 1,
                    transition: "color 0.2s ease",
                  }}>
                    {shirt.id.replace("2", "")}
                  </div>
                </div>

                {/* Zone dot */}
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: color,
                  marginTop: 7,
                  opacity: isSelected ? 1 : 0.15,
                  boxShadow: isSelected ? `0 0 8px ${color}` : "none",
                  transition: "opacity 0.2s ease, box-shadow 0.2s ease",
                }} />
              </div>
            );
          })}
        </div>

        {/* Edge fades */}
        <div style={{
          position: "absolute", top: 0, left: 0, bottom: 0, width: 56,
          background: "linear-gradient(to right, #0A0F1E, transparent)",
          pointerEvents: "none", zIndex: 5,
        }} />
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 0, width: 56,
          background: "linear-gradient(to left, #0A0F1E, transparent)",
          pointerEvents: "none", zIndex: 5,
        }} />
      </div>

      <div style={{ width: "100%", maxWidth: 480, padding: "0 24px" }}>

        {/* Selected pills */}
        <div style={{
          minHeight: 38,
          display: "flex",
          gap: 8,
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: 24,
          alignItems: "center",
        }}>
          {selectedList.length === 0 ? (
            <div style={{
              fontSize: 13, color: "rgba(255,255,255,0.18)", letterSpacing: "0.5px",
            }}>
              No shirts selected yet
            </div>
          ) : selectedList.map(s => {
            const color = getZoneColor(s.id);
            return (
              <div
                key={s.id}
                className="pill"
                onClick={() => toggle(s.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 100,
                  background: `${color}18`,
                  border: `1.5px solid ${color}`,
                  color,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "1px",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  transition: "opacity 0.15s ease",
                }}
              >
                {s.id.replace("2", "")}
                <span style={{ opacity: 0.45, fontSize: 10 }}>✕</span>
              </div>
            );
          })}
        </div>

        {/* Max hint */}
        {selected.size === 3 && (
          <div style={{
            textAlign: "center", marginBottom: 14,
            fontSize: 12, color: "rgba(255,255,255,0.28)",
            letterSpacing: "0.3px", animation: "fadeIn 0.3s ease forwards",
          }}>
            Maximum reached — tap a shirt or pill to remove
          </div>
        )}

        {/* Confirm */}
        <button
          className="confirm-btn"
          disabled={selected.size === 0}
          style={{
            width: "100%",
            height: 54,
            borderRadius: 100,
            background: selected.size > 0 ? "#00FF87" : "rgba(255,255,255,0.05)",
            color: selected.size > 0 ? "#000" : "rgba(255,255,255,0.18)",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "2px",
            textTransform: "uppercase",
            cursor: selected.size > 0 ? "pointer" : "not-allowed",
            boxShadow: selected.size > 0 ? "0 4px 24px rgba(0,255,135,0.2)" : "none",
            transition: "all 0.3s ease",
          }}
        >
          {selected.size === 0
            ? "Select a position to continue"
            : `Confirm ${selected.size} position${selected.size > 1 ? "s" : ""}`}
        </button>

      </div>
    </div>
  );
}
