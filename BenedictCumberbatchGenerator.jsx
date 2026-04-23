import { useState, useEffect, useRef } from "react";

const FIRST_NAME_POOLS = [
  ["Percival", "Algernon", "Barnabas", "Crispin", "Reginald", "Humphrey"],
  ["Thaddeus", "Archibald", "Ignatius", "Bartholomew", "Gideon", "Alistair"],
  ["Mortimer", "Caspian", "Phineas", "Rutherford", "Leofric", "Peregrine"],
  ["Pemberley", "Oswald", "Sylvester", "Horatio", "Cornelius", "Fitzwilliam"],
  ["Balthazar", "Lysander", "Willoughby", "Reginald", "Alistair", "Montgomery"],
  ["Ebenezer", "Quentin", "Roscoe", "Sheridan", "Thornton", "Ulysses"],
];

const LAST_NAME_POOLS = [
  ["Crumplehorn", "Bumbershoot", "Snodgrass", "Featherbottom", "Cabbagepatch"],
  ["Winklebottom", "Puddlejump", "Mufflebottom", "Rattlewick", "Blunderbuss"],
  ["Crumblethwaite", "Swampington", "Squabbleston", "Fumblethatch", "Blottington"],
  ["Dribbleston", "Flumperton", "Grumbleshire", "Hobblethwick", "Jiggleston"],
  ["Knotsworth", "Muddlecroft", "Noodlewick", "Pebblesworth", "Quibbleston"],
  ["Rumblethatch", "Scuttlewick", "Thistlethwaite", "Wobbleton", "Yodelhurst"],
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildSeedHint() {
  const firstName = pickRandom(pickRandom(FIRST_NAME_POOLS));
  const lastName = pickRandom(pickRandom(LAST_NAME_POOLS));
  return `For inspiration this time, consider names in the spirit of "${firstName}" and "${lastName}" — but feel free to invent something entirely different and more surprising. Do NOT use those exact names.`;
}

const SYSTEM_PROMPT = `You are the Benedict Cumberbatch Name Generator. Your sole purpose is to invent absurdly funny, vaguely British-sounding, almost plausible but completely made-up names — like "Benedict Cumberbatch" itself.

Rules:
- First names: Unusual, slightly pompous, vaguely classical or Victorian. Be maximally creative — do NOT default to common picks like Cornelius or Percival every time. Draw from the full spectrum of obscure Victorian, Latin, Greek, and medieval names.
- Last names: Sound like something a confused Victorian naturalist would name a beetle, a foggy English village, or a minor digestive complaint. Must be invented, not real surnames.
- The combination must sound absurd but almost believable as a real name
- CRITICAL: Every generation must be genuinely different from previous ones — vary the syllable count, sounds, and register dramatically
- Respond ONLY with a JSON object, no markdown, no explanation:
{"firstName": "...", "lastName": "...", "funFact": "..."}

Where:
- funFact: a single absurd, deadpan sentence about this person (e.g. "Once won a staring contest with a turnip.")`;

const COLORS = {
  bg: "#0e0c0a",
  paper: "#1a1612",
  gold: "#c9a84c",
  goldLight: "#e8c97a",
  cream: "#f5f0e8",
  muted: "#7a6e5f",
  accent: "#8b3a2a",
};

export default function App() {
  const [name, setName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [flipState, setFlipState] = useState("idle");
  const [error, setError] = useState(null);

  async function generateName() {
    if (loading) return;
    setLoading(true);
    setError(null);
    setFlipState("spinning");
    const seedHint = buildSeedHint();

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Generate a new ridiculous name. ${seedHint}` }],
        }),
      });

      const data = await response.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      // 1. Snap card to 90° (edge-on, invisible) with no transition
      setFlipState("revealing");
      // 2. Wait for the browser to actually paint the 90° state before swapping content
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      setName(parsed);
      setHistory(prev => [parsed, ...prev].slice(0, 8));
      // 3. Another paint cycle, then ease back to 0° so new name sweeps in
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      setFlipState("idle");
    } catch (err) {
      setFlipState("idle");
      setError("The name generation machine has temporarily jammed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    generateName();
  }, []);

  const getCardStyle = () => {
    const base = {
      background: COLORS.paper,
      border: `1px solid rgba(201,168,76,0.25)`,
      borderRadius: 4,
      padding: "40px 44px",
      textAlign: "center",
      position: "relative",
      boxShadow: `0 0 0 1px rgba(201,168,76,0.08), 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.1)`,
    };
    if (flipState === "spinning") {
      return { ...base, animation: "continuousSpin 1.2s linear infinite" };
    }
    if (flipState === "revealing") {
      return { ...base, transform: "rotateY(90deg)", transition: "none" };
    }
    // idle
    return { ...base, transform: "rotateY(0deg)", transition: "transform 0.4s ease-out" };
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: COLORS.cream,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: `radial-gradient(ellipse at 20% 20%, rgba(201,168,76,0.04) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 80%, rgba(139,58,42,0.06) 0%, transparent 60%)`,
        pointerEvents: "none",
      }} />

      <div style={{ textAlign: "center", marginBottom: 48, position: "relative" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.35em", color: COLORS.gold, textTransform: "uppercase", marginBottom: 14 }}>
          ✦ Established 1976, Hammersmith ✦
        </div>
        <h1 style={{ fontSize: "clamp(28px, 6vw, 54px)", fontWeight: "normal", margin: 0, lineHeight: 1.1, color: COLORS.cream, letterSpacing: "-0.01em" }}>
          The Benedict Cumberbatch
        </h1>
        <h2 style={{ fontSize: "clamp(18px, 3.5vw, 30px)", fontWeight: "normal", margin: "6px 0 0", color: COLORS.gold, fontStyle: "italic", letterSpacing: "0.05em" }}>
          Name Generator
        </h2>
        <div style={{ width: 180, height: 1, background: `linear-gradient(to right, transparent, ${COLORS.gold}, transparent)`, margin: "18px auto 0" }} />
        <p style={{ color: COLORS.muted, fontSize: 13, marginTop: 12, letterSpacing: "0.02em", fontStyle: "italic" }}>
          Purveyors of Absurd Names Since the Victorian Era
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 580, perspective: "1000px", marginBottom: 32 }}>
        <div style={getCardStyle()}>
          {["topleft","topright","bottomleft","bottomright"].map(pos => (
            <div key={pos} style={{
              position: "absolute",
              [pos.includes("top") ? "top" : "bottom"]: 12,
              [pos.includes("left") ? "left" : "right"]: 12,
              width: 24, height: 24,
              borderTop: pos.includes("top") ? `1px solid ${COLORS.gold}` : "none",
              borderBottom: pos.includes("bottom") ? `1px solid ${COLORS.gold}` : "none",
              borderLeft: pos.includes("left") ? `1px solid ${COLORS.gold}` : "none",
              borderRight: pos.includes("right") ? `1px solid ${COLORS.gold}` : "none",
              opacity: 0.5,
            }} />
          ))}

          {loading && !name ? (
            <div style={{ padding: "40px 0" }}>
              <p style={{ color: COLORS.muted, fontStyle: "italic", fontSize: 14 }}>
                Consulting the Registry of Ridiculous Names…
              </p>
            </div>
          ) : error ? (
            <div style={{ padding: "20px 0", color: COLORS.accent }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
              <p style={{ fontStyle: "italic" }}>{error}</p>
            </div>
          ) : name ? (
            <>
              <div style={{ fontSize: "clamp(32px, 7vw, 52px)", fontWeight: "bold", color: COLORS.cream, lineHeight: 1.05, marginBottom: 8, letterSpacing: "-0.02em" }}>
                {name.firstName}
              </div>
              <div style={{ fontSize: "clamp(28px, 6vw, 44px)", fontWeight: "normal", color: COLORS.goldLight, fontStyle: "italic", marginBottom: 28, letterSpacing: "0.01em" }}>
                {name.lastName}
              </div>
              <div style={{ width: 60, height: 1, background: `linear-gradient(to right, transparent, ${COLORS.gold}, transparent)`, margin: "0 auto 20px" }} />
              <p style={{ color: COLORS.muted, fontSize: 14, fontStyle: "italic", lineHeight: 1.6, maxWidth: 360, margin: "0 auto" }}>
                "{name.funFact}"
              </p>
            </>
          ) : null}
        </div>
      </div>

      <button
        onClick={generateName}
        disabled={loading}
        style={{
          background: loading ? "transparent" : COLORS.gold,
          color: loading ? COLORS.muted : COLORS.bg,
          border: `1px solid ${COLORS.gold}`,
          padding: "14px 44px",
          fontSize: 13,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s ease",
          marginBottom: 48,
          borderRadius: 2,
          opacity: loading ? 0.5 : 1,
        }}
        onMouseEnter={e => { if (!loading) { e.target.style.background = COLORS.goldLight; e.target.style.borderColor = COLORS.goldLight; }}}
        onMouseLeave={e => { if (!loading) { e.target.style.background = COLORS.gold; e.target.style.borderColor = COLORS.gold; }}}
      >
        {loading ? "Generating…" : "✦ Generate Name ✦"}
      </button>

      {history.length > 1 && (
        <div style={{ width: "100%", maxWidth: 580 }}>
          <div style={{ textAlign: "center", fontSize: 10, letterSpacing: "0.3em", color: COLORS.muted, textTransform: "uppercase", marginBottom: 16 }}>
            Previously Minted Names
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.slice(1).map((h, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(201,168,76,0.1)",
                borderRadius: 2,
                padding: "12px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: 1 - i * 0.12,
              }}>
                <span style={{ color: COLORS.cream, fontSize: 16 }}>
                  {h.firstName} <span style={{ color: COLORS.gold, fontStyle: "italic" }}>{h.lastName}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 48, fontSize: 11, color: COLORS.muted, letterSpacing: "0.15em", textAlign: "center", opacity: 0.5 }}>
        ✦ NO ACTUAL BENEDICTS WERE HARMED IN THE MAKING OF THIS APP ✦
      </div>

      <style>{`
        @keyframes continuousSpin {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}
