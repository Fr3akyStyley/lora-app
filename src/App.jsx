import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { UI_TEXT, GAME_DISPLAY, PICK_LABELS, GAME_RULES } from "./translations";
import { onAuthStateChanged, signInWithPopup, signInWithCredential, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { App as CapacitorApp } from "@capacitor/app";

const GAMES = [
  "Što više",
  "Što manje",
  "Što više srca",
  "Što manje srca",
  "Dame",
  "J tref",
  "K srce + zadnja",
  "Tačkice",
  "Intuicija",
];

// Igre kod kojih igrači "nose" karte/ruke do ukupnog zbira (8), a poeni se računaju automatski
const TRICKS_CONFIG = {
  "Što više": { total: 8, per: -2 },
  "Što manje": { total: 8, per: 2, zeroBonus: -16 },
  "Što više srca": { total: 8, per: -2 },
  "Što manje srca": { total: 8, per: 2 },
  "Dame": { total: 4, per: 4, allBonus: -16 },
};

// Igre gde se bira igrač(i) koji nose poene
const PICK_CONFIG = {
  "J tref": { picks: [{ value: 16 }] },
  "K srce + zadnja": {
    picks: [{ value: 8 }, { value: 8 }],
  },
};

const CounterRow = ({ label, value, onChange, min = 0 }) => (
  <div className="flex items-center justify-between gap-2 bg-surface border border-rim rounded-lg px-3 py-2">
    <span className="font-medium truncate">{label}</span>
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(-1)}
        disabled={value <= min}
        className="w-9 h-9 rounded-lg bg-panel border border-rim text-gold text-xl font-bold disabled:opacity-30"
      >
        −
      </button>
      <span className="w-6 text-center text-xl font-bold">{value}</span>
      <button
        onClick={() => onChange(1)}
        className="w-9 h-9 rounded-lg bg-panel border border-rim text-gold text-xl font-bold"
      >
        +
      </button>
    </div>
  </div>
);

// Igre gde se broje "stvari" sa ukupnim zbirom ograničenim na total
const FREE_COUNTER_CONFIG = {
  "Intuicija": { per: -2, total: 8 },
};

const FreeCounter = ({ players, counts, onChange, total, t }) => {
  const sum = counts.reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-3">
      {players.map((player, idx) => (
        <div key={idx} className="flex items-center justify-between gap-2 bg-surface border border-rim rounded-lg px-3 py-2">
          <span className="font-medium truncate">{player}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onChange(idx, -1)}
              disabled={counts[idx] === 0}
              className="w-9 h-9 rounded-lg bg-panel border border-rim text-gold text-xl font-bold disabled:opacity-30"
            >
              −
            </button>
            <span className="w-6 text-center text-xl font-bold">{counts[idx]}</span>
            <button
              onClick={() => onChange(idx, 1)}
              disabled={total !== undefined && sum >= total}
              className="w-9 h-9 rounded-lg bg-panel border border-rim text-gold text-xl font-bold disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
      ))}
      {total !== undefined && (
        <div className={`text-center text-sm font-medium ${sum === total ? "text-gold" : "text-muted"}`}>
          {t("counter_total", { sum, total })}
        </div>
      )}
    </div>
  );
};

const PlayerPicker = ({ players, label, selected, onSelect }) => (
  <div className="space-y-2">
    <div className="text-sm text-muted text-center">{label}</div>
    <div className="grid grid-cols-2 gap-2">
      {players.map((p, idx) => (
        <Button
          key={idx}
          variant={selected === idx ? "default" : "outline"}
          onClick={() => onSelect(idx)}
          className="w-full py-3"
        >
          {p}
        </Button>
      ))}
    </div>
  </div>
);

const TrickCounter = ({ players, counts, total, onChange, t }) => {
  const sum = counts.reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-3">
      {players.map((player, idx) => (
        <div key={idx} className="flex items-center justify-between gap-2 bg-surface border border-rim rounded-lg px-3 py-2">
          <span className="font-medium truncate">{player}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onChange(idx, -1)}
              disabled={counts[idx] === 0}
              className="w-9 h-9 rounded-lg bg-panel border border-rim text-gold text-xl font-bold disabled:opacity-30"
            >
              −
            </button>
            <span className="w-6 text-center text-xl font-bold">{counts[idx]}</span>
            <button
              onClick={() => onChange(idx, 1)}
              disabled={sum >= total}
              className="w-9 h-9 rounded-lg bg-panel border border-rim text-gold text-xl font-bold disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
      ))}
      <div className={`text-center text-sm font-medium ${sum === total ? "text-gold" : "text-muted"}`}>
        {t("counter_total", { sum, total })}
      </div>
    </div>
  );
};

const Totals = ({ players, totals }) => (
  <div className="bg-panel px-4 py-3 rounded-xl border border-rim">
    <div className="grid grid-cols-4 gap-1 text-center text-xs font-medium text-muted mb-1">
      {players.map((p, idx) => (
        <div key={`name-${idx}`} className="truncate">{p || "-"}</div>
      ))}
    </div>
    <div className="grid grid-cols-4 gap-1 text-center text-2xl font-bold text-gold">
      {totals.map((t, idx) => (
        <div key={`score-${idx}`}>{t || 0}</div>
      ))}
    </div>
  </div>
);

const PLAYER_COLORS = ["#c9a84c", "#5cb8e4", "#e4705c", "#a78bfa"];

const HISTORY_LIMIT_FREE = 10;
const HISTORY_LIMIT_PREMIUM = 200;

const Podium = ({ players, totals, t }) => {
  const ranked = players
    .map((name, idx) => ({ name, total: totals[idx], idx }))
    .sort((a, b) => a.total - b.total);
  const [first, second, third, fourth] = ranked;
  const slots = [
    { player: second, medal: "🥈", height: "h-20" },
    { player: first, medal: "🥇", height: "h-28" },
    { player: third, medal: "🥉", height: "h-14" },
  ];
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-center gap-2">
        {slots.map((slot, i) => (
          <div key={i} className="flex flex-col items-center w-1/3">
            <div className="text-sm font-semibold truncate max-w-full">{slot.player?.name}</div>
            <div className="text-gold font-bold mb-1">{slot.player?.total ?? 0}</div>
            <div className={`w-full ${slot.height} bg-surface border border-rim rounded-t-lg flex items-center justify-center text-2xl`}>
              {slot.medal}
            </div>
          </div>
        ))}
      </div>
      {fourth && (
        <div className="text-center text-sm text-muted">
          {t("podium_fourth", { name: fourth.name })} ({fourth.total})
        </div>
      )}
    </div>
  );
};

const ScoreChart = ({ players, results, t }) => {
  const width = 300;
  const height = 160;
  const padding = { top: 10, right: 10, bottom: 8, left: 28 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const cumulative = players.map(() => [0]);
  results.forEach((r) => {
    players.forEach((_, idx) => {
      const prev = cumulative[idx][cumulative[idx].length - 1];
      cumulative[idx].push(prev + (Number(r.scores[idx]) || 0));
    });
  });

  const allValues = cumulative.flat();
  const minVal = Math.min(0, ...allValues);
  const maxVal = Math.max(0, ...allValues);
  const range = maxVal - minVal || 1;
  const roundsCount = cumulative[0].length - 1;

  const xFor = (i) => padding.left + (i / roundsCount) * chartW;
  const yFor = (v) => padding.top + chartH - ((v - minVal) / range) * chartH;

  return (
    <div className="bg-panel border border-rim rounded-xl p-3">
      <h3 className="font-semibold text-gold text-sm mb-2 text-center">{t("chart_title")}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <line x1={padding.left} y1={yFor(0)} x2={width - padding.right} y2={yFor(0)} stroke="#2d5a3d" strokeWidth="1" />
        {cumulative.map((series, idx) => (
          <polyline
            key={idx}
            fill="none"
            stroke={PLAYER_COLORS[idx]}
            strokeWidth="2"
            points={series.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ")}
          />
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 justify-center mt-2 text-xs">
        {players.map((p, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: PLAYER_COLORS[idx] }} />
            <span className="truncate max-w-[70px]">{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RoundTable = ({ players, results, language, t }) => (
  <div className="overflow-x-auto mt-4">
    <h3 className="font-semibold mb-2 text-gold text-sm">{t("history_title")}</h3>
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="text-muted">
          <th className="border border-rim p-1 text-left">#</th>
          <th className="border border-rim p-1 text-left">{t("history_player")}</th>
          <th className="border border-rim p-1 text-left">{t("history_game")}</th>
          {players.map((p, idx) => (
            <th key={idx} className="border border-rim p-1 text-center">{p}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {results.map((r, i) => (
          <tr key={i} className={i % 2 === 0 ? "bg-surface" : ""}>
            <td className="border border-rim p-1 text-center text-muted">{i + 1}</td>
            <td className="border border-rim p-1">{players[r.round % 4]}</td>
            <td className="border border-rim p-1">{GAME_DISPLAY[language][r.game] ?? r.game}</td>
            {r.scores.map((s, j) => (
              <td key={j} className="border border-rim p-1 text-center">{s}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const History = ({ t, language }) => {
  const [savedGames, setSavedGames] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("lora-history") || "[]";
    setSavedGames(JSON.parse(raw));
  }, []);

  if (!savedGames.length) return <div className="text-muted text-sm">{t("history_noGames")}</div>;

  return (
    <div className="space-y-3">
      {savedGames.map((game, idx) => {
        const winnerIdx = game.totals.indexOf(Math.min(...game.totals));
        const isExpanded = expanded === idx;
        return (
          <div key={idx} className="p-3 border border-rim rounded-lg bg-surface space-y-2">
            <div className="text-xs text-muted">{new Date(game.finishedAt).toLocaleDateString()}</div>
            <div className="space-y-1">
              {game.players.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className={i === winnerIdx ? "font-semibold text-gold" : ""}>
                    {i === winnerIdx ? "🏆 " : ""}{p}
                  </span>
                  <span className={i === winnerIdx ? "font-semibold text-gold" : "text-muted"}>{game.totals[i]}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setExpanded(isExpanded ? null : idx)} className="text-xs text-gold underline">
              {isExpanded ? t("history_hideDetails") : t("history_showDetails")}
            </button>
            {isExpanded && (
              <div className="space-y-3 pt-1">
                <Podium players={game.players} totals={game.totals} t={t} />
                <ScoreChart players={game.players} results={game.results} t={t} />
                <RoundTable players={game.players} results={game.results} language={language} t={t} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function App() {
  const savedToHistoryRef = useRef(false);
  const [players, setPlayers] = useState(["", "", "", ""]);
  const [started, setStarted] = useState(false);
  const [playedGames, setPlayedGames] = useState([]);
  const [round, setRound] = useState(0);
  const [selectedGame, setSelectedGame] = useState("");
  const [results, setResults] = useState([]);
  const [roundCounts, setRoundCounts] = useState([0, 0, 0, 0]);
  const [roundPicks, setRoundPicks] = useState([]);
  const [roundWinner, setRoundWinner] = useState(null);
  const [roundRemaining, setRoundRemaining] = useState([0, 0, 0, 0]);
  const [roundDouble, setRoundDouble] = useState(false);
  const [screen, setScreen] = useState("home"); // "home" | "setup" | "rules" | "game"
  const [selectedGames, setSelectedGames] = useState([...GAMES]);
  const [profiles, setProfiles] = useState([]);
  const [language, setLanguage] = useState("sr");
  const [user, setUser] = useState(null);
  const [customName, setCustomName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [premium, setPremium] = useState(false);

  const t = (key, vars) => {
    let str = UI_TEXT[language][key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  };

  useEffect(() => {
    const saved = localStorage.getItem("lora-game");
    if (saved) {
      const data = JSON.parse(saved);
      setPlayers(data.players || ["", "", "", ""]);
      setStarted(data.started || false);
      setPlayedGames((data.playedGames || []).map((arr) => new Set(arr)));
      setRound(data.round || 0);
      setSelectedGame(data.selectedGame || "");
      setResults(data.results || []);
      setSelectedGames(data.selectedGames || [...GAMES]);
    }
    const savedProfiles = localStorage.getItem("lora-profiles");
    if (savedProfiles) setProfiles(JSON.parse(savedProfiles));
    const savedLanguage = localStorage.getItem("lora-lang");
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    localStorage.setItem("lora-lang", language);
  }, [language]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listenerPromise = CapacitorApp.addListener("backButton", () => {
      if (screen === "setup-games") {
        setScreen("setup");
      } else if (screen === "home") {
        CapacitorApp.exitApp();
      } else {
        setScreen("home");
      }
    });
    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [screen]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) return;
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      const localProfiles = JSON.parse(localStorage.getItem("lora-profiles") || "[]");
      const localHistory = JSON.parse(localStorage.getItem("lora-history") || "[]");
      if (snap.exists()) {
        const cloud = snap.data();
        const isPremium = cloud.premium || false;
        const historyLimit = isPremium ? HISTORY_LIMIT_PREMIUM : HISTORY_LIMIT_FREE;
        const mergedProfiles = Array.from(new Set([...(cloud.profiles || []), ...localProfiles]));
        const mergedHistory = [...localHistory, ...(cloud.history || [])]
          .sort((a, b) => b.finishedAt - a.finishedAt)
          .filter((g, idx, arr) => arr.findIndex((x) => x.finishedAt === g.finishedAt) === idx)
          .slice(0, historyLimit);
        setProfiles(mergedProfiles);
        setCustomName(cloud.displayName || "");
        setPremium(isPremium);
        localStorage.setItem("lora-profiles", JSON.stringify(mergedProfiles));
        localStorage.setItem("lora-history", JSON.stringify(mergedHistory));
        await setDoc(ref, { profiles: mergedProfiles, history: mergedHistory }, { merge: true });
      } else {
        await setDoc(ref, { profiles: localProfiles, history: localHistory }, { merge: true });
      }
    });
    return unsub;
  }, []);

  const login = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        const credential = GoogleAuthProvider.credential(result.credential?.idToken);
        await signInWithCredential(auth, credential);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const logout = async () => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut();
    }
    await signOut(auth);
    setCustomName("");
    setEditingName(false);
    setPremium(false);
  };

  const syncCloud = (newProfiles, newHistory) => {
    if (!user) return;
    setDoc(doc(db, "users", user.uid), { profiles: newProfiles, history: newHistory }, { merge: true }).catch((e) => console.error(e));
  };

  const saveDisplayName = (name) => {
    setCustomName(name);
    if (user) {
      setDoc(doc(db, "users", user.uid), { displayName: name }, { merge: true }).catch((e) => console.error(e));
    }
  };

  useEffect(() => {
    if (!started) return;
    const data = {
      players,
      started,
      playedGames: playedGames.map((s) => Array.from(s)),
      round,
      selectedGame,
      results,
      selectedGames,
    };
    localStorage.setItem("lora-game", JSON.stringify(data));
  }, [players, started, playedGames, round, selectedGame, results, selectedGames]);

  const resetGame = () => {
    savedToHistoryRef.current = false;
    setPlayers(["", "", "", ""]);
    setStarted(false);
    setPlayedGames([]);
    setRound(0);
    setSelectedGame("");
    setResults([]);
    setRoundCounts([0, 0, 0, 0]);
    setRoundPicks([]);
    setRoundWinner(null);
    setRoundRemaining([0, 0, 0, 0]);
    setRoundDouble(false);
    setSelectedGames([...GAMES]);
    localStorage.removeItem("lora-game");
    setScreen("home");
  };

  const undoLastRound = () => {
    if (round > 0 && results.length > 0) {
      const last = results[results.length - 1];
      const updatedGames = playedGames.map((set) => new Set(set));
      updatedGames[last.round % 4].delete(last.game);
      setPlayedGames(updatedGames);
      setResults(results.slice(0, -1));
      setRound(round - 1);
      setSelectedGame("");
    }
  };

  const handleNameChange = (idx, val) => {
    const copy = [...players];
    copy[idx] = val;
    setPlayers(copy);
  };

  const allNamesEntered = players.every((p) => p.trim().length);

  const pickProfile = (name) => {
    const emptyIdx = players.findIndex((p) => !p.trim().length);
    if (emptyIdx === -1) return;
    handleNameChange(emptyIdx, name);
  };

  const removeProfile = (name) => {
    const updated = profiles.filter((p) => p !== name);
    setProfiles(updated);
    localStorage.setItem("lora-profiles", JSON.stringify(updated));
    syncCloud(updated, JSON.parse(localStorage.getItem("lora-history") || "[]"));
  };

  const toggleGame = (g) => {
    setSelectedGames((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : GAMES.filter((x) => prev.includes(x) || x === g)
    );
  };

  const startGame = () => {
    if (allNamesEntered && selectedGames.length > 0) {
      const updatedProfiles = [...profiles];
      players.forEach((p) => {
        const name = p.trim();
        if (name && !updatedProfiles.includes(name)) updatedProfiles.push(name);
      });
      setProfiles(updatedProfiles);
      localStorage.setItem("lora-profiles", JSON.stringify(updatedProfiles));
      syncCloud(updatedProfiles, JSON.parse(localStorage.getItem("lora-history") || "[]"));
      setPlayedGames(players.map(() => new Set()));
      setRound(0);
      setStarted(true);
      setResults([]);
      savedToHistoryRef.current = false;
      setScreen("game");
    }
  };

  const totalRounds = players.length * selectedGames.length;

  const totals = useMemo(() => {
    const sum = Array(4).fill(0);
    results.forEach((r) => {
      r.scores.forEach((s, idx) => {
        sum[idx] += Number(s) || 0;
      });
    });
    return sum;
  }, [results]);

  useEffect(() => {
    if (round === totalRounds && !savedToHistoryRef.current) {
      savedToHistoryRef.current = true;
      const saved = localStorage.getItem("lora-history") || "[]";
      const parsed = JSON.parse(saved);
      parsed.unshift({ players, results, totals, finishedAt: Date.now() });
      const trimmed = parsed.slice(0, premium ? HISTORY_LIMIT_PREMIUM : HISTORY_LIMIT_FREE);
      localStorage.setItem("lora-history", JSON.stringify(trimmed));
      syncCloud(profiles, trimmed);
    }
  }, [round, totalRounds, premium]);

  if (screen === "home") {
    return (
      <div className="min-h-screen bg-felt text-white flex flex-col">
        <div className="max-w-sm mx-auto w-full px-4 py-8 space-y-5 flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-gold text-center tracking-wide">🃏 Lora</h1>
          <div className="space-y-3">
            <Button
              onClick={() => {
                setPlayers(["", "", "", ""]);
                setScreen("setup");
              }}
              className="w-full py-3 text-base"
            >
              {t("home_newGame")}
            </Button>
            <Button
              variant="outline"
              disabled={!started}
              onClick={() => setScreen("game")}
              className="w-full py-3 text-base"
            >
              {t("home_continueGame")}
            </Button>
            <Button variant="outline" onClick={() => setScreen("rules")} className="w-full py-3 text-base">
              {t("home_rules")}
            </Button>
            <Button variant="outline" onClick={() => setScreen("history")} className="w-full py-3 text-base">
              {t("home_showHistory")}
            </Button>
            <Button variant="outline" onClick={() => setScreen("premium")} className="w-full py-3 text-base">
              {t("home_premium")}
            </Button>
          </div>
          {user ? (
            <div className="space-y-2">
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={t("login_namePlaceholder")}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      saveDisplayName(nameInput.trim());
                      setEditingName(false);
                    }}
                    className="px-3"
                  >
                    {t("login_save")}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-center text-xs text-muted truncate">
                  <span className="truncate">
                    {t("login_signedInAs", { name: customName || user.displayName || user.email })}
                  </span>
                  <button
                    onClick={() => {
                      setNameInput(customName || user.displayName || "");
                      setEditingName(true);
                    }}
                    className="shrink-0 text-gold-light"
                    aria-label={t("login_namePlaceholder")}
                  >
                    ✎
                  </button>
                </div>
              )}
              <Button variant="outline" onClick={logout} className="w-full py-2 text-sm">
                {t("login_signOut")}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={login} className="w-full py-2 text-sm">
              {t("login_signIn")}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setLanguage((l) => (l === "sr" ? "en" : "sr"))}
            className="w-full py-2 text-sm"
          >
            {language === "sr" ? "🇬🇧 English" : "🇷🇸 Srpski"}
          </Button>
        </div>
      </div>
    );
  }

  if (screen === "history") {
    return (
      <div className="min-h-screen bg-felt text-white">
        <div className="max-w-sm mx-auto w-full px-4 py-8 space-y-4">
          <h2 className="text-2xl font-bold text-gold text-center">{t("history_finishedTitle")}</h2>
          <History t={t} language={language} />
          <Button variant="outline" onClick={() => setScreen("home")} className="w-full py-3 text-base">
            {t("rules_back")}
          </Button>
        </div>
      </div>
    );
  }

  if (screen === "rules") {
    return (
      <div className="min-h-screen bg-felt text-white">
        <div className="max-w-sm mx-auto w-full px-4 py-8 space-y-4">
          <h2 className="text-2xl font-bold text-gold text-center">{t("rules_title")}</h2>
          <div className="text-sm text-muted space-y-2">
            <p>{t("rules_intro")}</p>
          </div>
          <div className="space-y-3 text-sm">
            {GAMES.map((g) => (
              <div key={g} className="bg-surface border border-rim rounded-lg p-3">
                <div className="font-semibold text-gold mb-1">{GAME_DISPLAY[language][g]}</div>
                {GAME_RULES[language][g].map((p, idx) => (
                  <p key={idx} className={`text-muted ${idx > 0 ? "mt-2" : ""}`}>{p}</p>
                ))}
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => setScreen("home")} className="w-full py-3 text-base">
            {t("rules_back")}
          </Button>
        </div>
      </div>
    );
  }

  if (screen === "premium") {
    return (
      <div className="min-h-screen bg-felt text-white">
        <div className="max-w-sm mx-auto w-full px-4 py-8 space-y-4">
          <h2 className="text-2xl font-bold text-gold text-center">{t("premium_title")}</h2>
          <div className="bg-surface border border-rim rounded-lg p-3 text-sm text-muted text-center">
            {premium ? t("premium_status_active") : t("premium_status_inactive")}
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted">{t("premium_intro")}</p>
            <ul className="space-y-1 list-disc list-inside text-muted">
              <li>{t("premium_feature_history", { limit: HISTORY_LIMIT_FREE })}</li>
              <li>{t("premium_feature_ads")}</li>
            </ul>
          </div>
          {!premium && (
            <div className="bg-surface border border-rim rounded-lg p-3 text-sm text-muted text-center">
              {user ? t("premium_comingSoon") : t("premium_loginRequired")}
            </div>
          )}
          <Button variant="outline" onClick={() => setScreen("home")} className="w-full py-3 text-base">
            {t("premium_back")}
          </Button>
        </div>
      </div>
    );
  }

  if (screen === "setup") {
    return (
      <div className="min-h-screen bg-felt text-white flex flex-col">
        <div className="max-w-sm mx-auto w-full px-4 py-8 space-y-5">
          <h1 className="text-3xl font-bold text-gold text-center tracking-wide">🃏 Lora</h1>
          <h2 className="text-base font-semibold text-center text-muted">{t("setup_enterNames")}</h2>
          <div className="space-y-3">
            {players.map((p, idx) => (
              <Input
                key={idx}
                value={p}
                onChange={(e) => handleNameChange(idx, e.target.value)}
                placeholder={t("setup_playerPlaceholder", { n: idx + 1 })}
              />
            ))}
          </div>
          {profiles.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-center text-muted">{t("setup_savedPlayers")}</h2>
              <div className="flex flex-wrap gap-2 justify-center">
                {profiles.map((name) => (
                  <div key={name} className="flex items-center gap-1 bg-surface border border-rim rounded-lg pl-3 pr-1 py-1">
                    <button onClick={() => pickProfile(name)} className="font-medium text-sm">
                      {name}
                    </button>
                    <button
                      onClick={() => removeProfile(name)}
                      className="w-6 h-6 rounded text-muted hover:text-white text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button disabled={!allNamesEntered} onClick={() => setScreen("setup-games")} className="w-full py-3 text-base">
            {t("setup_next")}
          </Button>
          <Button variant="outline" onClick={() => setScreen("home")} className="w-full">
            {t("setup_back")}
          </Button>
        </div>
      </div>
    );
  }

  if (screen === "setup-games") {
    return (
      <div className="min-h-screen bg-felt text-white flex flex-col">
        <div className="max-w-sm mx-auto w-full px-4 py-8 space-y-5">
          <h1 className="text-3xl font-bold text-gold text-center tracking-wide">🃏 Lora</h1>
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-center text-muted">
              {t("setupGames_chooseGames", { n: selectedGames.length, total: GAMES.length })}
            </h2>
            <div className="space-y-2">
              {GAMES.map((g) => (
                <label
                  key={g}
                  className="flex items-center gap-3 bg-surface border border-rim rounded-lg px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedGames.includes(g)}
                    onChange={() => toggleGame(g)}
                    className="w-4 h-4 accent-gold"
                  />
                  <span className="font-medium">{GAME_DISPLAY[language][g] ?? g}</span>
                </label>
              ))}
            </div>
            <div className="text-center text-muted text-sm">
              {t("setupGames_totalRounds", { n: totalRounds })}
            </div>
          </div>
          <Button disabled={!allNamesEntered || selectedGames.length === 0} onClick={startGame} className="w-full py-3 text-base">
            {t("setupGames_start")}
          </Button>
          <Button variant="outline" onClick={() => setScreen("setup")} className="w-full">
            {t("setup_back")}
          </Button>
        </div>
      </div>
    );
  }

  const pickerIndex = round % 4;
  const pickerName = players[pickerIndex];

  const cancelGameSelection = () => {
    const updated = playedGames.map((set) => new Set(set));
    updated[pickerIndex].delete(selectedGame);
    setPlayedGames(updated);
    setSelectedGame("");
    setRoundCounts([0, 0, 0, 0]);
    setRoundPicks([]);
    setRoundWinner(null);
    setRoundRemaining([0, 0, 0, 0]);
    setRoundDouble(false);
  };

  const chooseGame = (game) => {
    const updated = playedGames.map((set) => new Set(set));
    updated[pickerIndex].add(game);
    setPlayedGames(updated);
    setSelectedGame(game);
    setRoundCounts([0, 0, 0, 0]);
    setRoundPicks((PICK_CONFIG[game]?.picks ?? []).map(() => null));
    setRoundWinner(null);
    setRoundRemaining([0, 0, 0, 0]);
    setRoundDouble(false);
  };

  const submitScores = (scores) => {
    setResults((prev) => [...prev, { round, game: selectedGame, scores }]);
    setSelectedGame("");
    setRound((r) => r + 1);
    setRoundCounts([0, 0, 0, 0]);
    setRoundPicks([]);
    setRoundWinner(null);
    setRoundRemaining([0, 0, 0, 0]);
    setRoundDouble(false);
  };

  const finished = round >= totalRounds;
  if (finished) {
    return (
      <div className="min-h-screen bg-felt text-white">
        <div className="max-w-sm mx-auto w-full px-4 py-8 space-y-5 text-center">
          <h2 className="text-2xl font-bold text-gold">{t("game_finished")}</h2>
          <Podium players={players} totals={totals} t={t} />
          <ScoreChart players={players} results={results} t={t} />
          <RoundTable players={players} results={results} language={language} t={t} />
          <Button variant="outline" onClick={resetGame} className="w-full py-3">{t("game_newGame")}</Button>
          <Button variant="outline" onClick={() => setScreen("home")} className="w-full py-3">{t("game_backToMenu").replace("← ", "")}</Button>
        </div>
      </div>
    );
  }

  const already = playedGames[pickerIndex];

  if (!selectedGame) {
    return (
      <div className="min-h-screen bg-felt text-white">
        <div className="max-w-sm mx-auto w-full px-4 py-6 space-y-4">
          <Button variant="outline" onClick={() => setScreen("home")} className="w-full py-2 text-sm">
            {t("game_backToMenu")}
          </Button>
          <Totals players={players} totals={totals} />
          <div className="text-center">
            <div className="text-muted text-sm">{t("game_roundOf", { n: round + 1, total: totalRounds })}</div>
            <div className="text-lg font-bold">
              {t("game_picks")} <span className="text-gold">{pickerName}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {selectedGames.map((g) => {
              const disabled = already.has(g);
              return (
                <Button
                  key={g}
                  disabled={disabled}
                  variant={disabled ? "outline" : "default"}
                  onClick={() => !disabled && chooseGame(g)}
                  className="w-full py-3"
                >
                  {GAME_DISPLAY[language][g] ?? g}
                </Button>
              );
            })}
          </div>
          <RoundTable players={players} results={results} language={language} t={t} />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={undoLastRound} className="flex-1">{t("game_undoRound")}</Button>
            <Button variant="destructive" onClick={resetGame} className="flex-1">{t("game_reset")}</Button>
          </div>
        </div>
      </div>
    );
  }

  const tricksConfig = TRICKS_CONFIG[selectedGame];

  const adjustCount = (idx, delta) => {
    setRoundCounts((prev) => {
      const sum = prev.reduce((a, b) => a + b, 0);
      if (sum + delta < 0 || sum + delta > tricksConfig.total) return prev;
      const copy = [...prev];
      copy[idx] = Math.max(0, copy[idx] + delta);
      return copy;
    });
  };

  const tricksSum = roundCounts.reduce((a, b) => a + b, 0);
  const tricksScores = roundCounts.map((c) => {
    if (tricksConfig?.allBonus !== undefined && c === tricksConfig.total) return tricksConfig.allBonus;
    if (c === 0 && tricksConfig?.zeroBonus !== undefined) return tricksConfig.zeroBonus;
    return c * (tricksConfig?.per ?? 0);
  });

  const freeCounterConfig = FREE_COUNTER_CONFIG[selectedGame];

  const adjustFreeCount = (idx, delta) => {
    setRoundCounts((prev) => {
      const sum = prev.reduce((a, b) => a + b, 0);
      if (prev[idx] + delta < 0) return prev;
      if (freeCounterConfig?.total !== undefined && sum + delta > freeCounterConfig.total) return prev;
      const copy = [...prev];
      copy[idx] = copy[idx] + delta;
      return copy;
    });
  };

  const freeCounterScores = roundCounts.map((c) => c * (freeCounterConfig?.per ?? 0));
  const freeCounterSum = roundCounts.reduce((a, b) => a + b, 0);

  const adjustRemaining = (idx, delta) => {
    setRoundRemaining((prev) => {
      if (prev[idx] + delta < 0) return prev;
      const copy = [...prev];
      copy[idx] = copy[idx] + delta;
      return copy;
    });
  };

  const tackiceMultiplier = roundDouble ? 2 : 1;
  const tackiceScores = players.map((_, idx) =>
    idx === roundWinner ? -8 * tackiceMultiplier : (roundRemaining[idx] + roundCounts[idx]) * tackiceMultiplier
  );

  const pickConfig = PICK_CONFIG[selectedGame];

  const setPick = (pickIdx, playerIdx) => {
    const copy = [...roundPicks];
    copy[pickIdx] = playerIdx;
    setRoundPicks(copy);
  };

  const picksComplete = pickConfig ? roundPicks.every((p) => p !== null) : false;
  const pickScores = players.map((_, playerIdx) =>
    pickConfig?.picks.reduce(
      (sum, pick, pickIdx) => sum + (roundPicks[pickIdx] === playerIdx ? pick.value : 0),
      0
    ) ?? 0
  );

  return (
    <div className="min-h-screen bg-felt text-white">
      <div className="max-w-sm mx-auto w-full px-4 py-6 space-y-4">
        <Button variant="outline" onClick={() => setScreen("home")} className="w-full py-2 text-sm">
          {t("game_backToMenu")}
        </Button>
        <Totals players={players} totals={totals} />
        <div className="text-center">
          <div className="text-muted text-sm">{t("game_round", { n: round + 1 })}</div>
          <div className="text-lg font-bold text-gold">{GAME_DISPLAY[language][selectedGame] ?? selectedGame}</div>
        </div>
        {selectedGame === "Tačkice" ? (
          <>
            <div className="space-y-2">
              <div className="text-sm text-muted text-center">{t("tackice_label")}</div>
              <FreeCounter players={players} counts={roundCounts} onChange={adjustFreeCount} t={t} />
            </div>
            <PlayerPicker
              players={players}
              label={t("tackice_winner")}
              selected={roundWinner}
              onSelect={setRoundWinner}
            />
            {roundWinner !== null && (
              <div className="space-y-2">
                <div className="text-sm text-muted text-center">{t("tackice_remaining")}</div>
                {players.map((player, idx) =>
                  idx === roundWinner ? null : (
                    <CounterRow
                      key={idx}
                      label={player}
                      value={roundRemaining[idx]}
                      onChange={(d) => adjustRemaining(idx, d)}
                    />
                  )
                )}
                <label className="flex items-center gap-2 justify-center text-sm pt-1">
                  <input
                    type="checkbox"
                    checked={roundDouble}
                    onChange={(e) => setRoundDouble(e.target.checked)}
                    className="w-4 h-4 accent-gold"
                  />
                  {t("tackice_double")}
                </label>
              </div>
            )}
            <Button
              disabled={roundWinner === null}
              onClick={() => submitScores(tackiceScores)}
              className="w-full py-3 text-base"
            >
              {t("game_finishRound")}
            </Button>
          </>
        ) : tricksConfig ? (
          <>
            <TrickCounter players={players} counts={roundCounts} total={tricksConfig.total} onChange={adjustCount} t={t} />
            <Button
              disabled={tricksSum !== tricksConfig.total}
              onClick={() => submitScores(tricksScores)}
              className="w-full py-3 text-base"
            >
              {t("game_finishRound")}
            </Button>
          </>
        ) : freeCounterConfig ? (
          <>
            <FreeCounter players={players} counts={roundCounts} onChange={adjustFreeCount} total={freeCounterConfig.total} t={t} />
            <Button
              disabled={freeCounterConfig.total !== undefined && freeCounterSum !== freeCounterConfig.total}
              onClick={() => submitScores(freeCounterScores)}
              className="w-full py-3 text-base"
            >
              {t("game_finishRound")}
            </Button>
          </>
        ) : pickConfig ? (
          <>
            <div className="space-y-4">
              {pickConfig.picks.map((pick, pickIdx) => (
                <PlayerPicker
                  key={pickIdx}
                  players={players}
                  label={PICK_LABELS[language][selectedGame][pickIdx]}
                  selected={roundPicks[pickIdx]}
                  onSelect={(playerIdx) => setPick(pickIdx, playerIdx)}
                />
              ))}
            </div>
            <Button
              disabled={!picksComplete}
              onClick={() => submitScores(pickScores)}
              className="w-full py-3 text-base"
            >
              {t("game_finishRound")}
            </Button>
          </>
        ) : null}
        <div className="flex gap-2">
          <Button variant="outline" onClick={cancelGameSelection} className="flex-1">{t("game_undoRound")}</Button>
          <Button variant="destructive" onClick={resetGame} className="flex-1">{t("game_reset")}</Button>
        </div>
        <RoundTable players={players} results={results} language={language} t={t} />
      </div>
    </div>
  );
}
