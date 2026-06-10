import { useState, useMemo, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

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

// Prikaz imena igara sa emoji simbolima (interna imena ostaju ista)
const GAME_DISPLAY = {
  "Što više": "🔼 Što više",
  "Što manje": "🔽 Što manje",
  "Što više srca": "♥️🔼 Više srca",
  "Što manje srca": "♥️🔽 Manje srca",
  "Dame": "👸 Dame",
  "J tref": "♣️J Žandar",
  "K srce + zadnja": "K♥️+Zadnja",
  "Tačkice": "⚫ Tačkice",
  "Intuicija": "🔮 Intuicija",
};

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
  "J tref": { picks: [{ label: "Ko nosi žandara trefa?", value: 16 }] },
  "K srce + zadnja": {
    picks: [
      { label: "Ko nosi K srce?", value: 8 },
      { label: "Ko nosi zadnju ruku?", value: 8 },
    ],
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

const FreeCounter = ({ players, counts, onChange, total }) => {
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
          Ukupno: {sum} / {total}
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

const TrickCounter = ({ players, counts, total, onChange }) => {
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
        Ukupno: {sum} / {total}
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

const History = () => {
  const [savedGames, setSavedGames] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem("lora-history") || "[]";
    setSavedGames(JSON.parse(raw));
  }, []);

  if (!savedGames.length) return <div className="text-muted text-sm">Još nema sačuvanih partija.</div>;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg text-gold">Istorija završenih partija</h3>
      {savedGames.map((game, idx) => (
        <div key={idx} className="p-3 border border-rim rounded-lg bg-surface space-y-1">
          <div className="text-xs text-muted">{new Date(game.finishedAt).toLocaleString()}</div>
          <div className="font-semibold text-white">{game.players.join(" vs ")}</div>
          <div className="text-muted text-sm">Rezultati: {game.totals.join(" / ")}</div>
        </div>
      ))}
    </div>
  );
};

export default function App() {
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
  const [showHistory, setShowHistory] = useState(false);
  const [screen, setScreen] = useState("home"); // "home" | "setup" | "rules" | "game"
  const [selectedGames, setSelectedGames] = useState([...GAMES]);
  const [profiles, setProfiles] = useState([]);

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
  }, []);

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
      setPlayedGames(players.map(() => new Set()));
      setRound(0);
      setStarted(true);
      setResults([]);
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
    if (round === totalRounds) {
      const saved = localStorage.getItem("lora-history") || "[]";
      const parsed = JSON.parse(saved);
      parsed.unshift({ players, results, totals, finishedAt: Date.now() });
      localStorage.setItem("lora-history", JSON.stringify(parsed.slice(0, 20)));
    }
  }, [round, totalRounds]);

  if (screen === "home") {
    return (
      <div className="min-h-screen bg-felt text-white flex flex-col">
        <div className="max-w-sm mx-auto w-full px-4 py-8 space-y-5 flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-gold text-center tracking-wide">🃏 Lora</h1>
          <div className="space-y-3">
            <Button
              onClick={() => {
                setPlayers(["", "", "", ""]);
                setShowHistory(false);
                setScreen("setup");
              }}
              className="w-full py-3 text-base"
            >
              Nova partija
            </Button>
            <Button
              variant="outline"
              disabled={!started}
              onClick={() => setScreen("game")}
              className="w-full py-3 text-base"
            >
              Nastavi partiju
            </Button>
            <Button variant="outline" onClick={() => setScreen("rules")} className="w-full py-3 text-base">
              Pravila
            </Button>
            <Button variant="outline" onClick={() => setShowHistory((s) => !s)} className="w-full py-3 text-base">
              {showHistory ? "Sakrij istoriju" : "Istorija partija"}
            </Button>
            {showHistory && <History />}
          </div>
          <Button variant="outline" disabled className="w-full py-2 text-sm opacity-60">
            🇷🇸 Srpski (Engleski uskoro)
          </Button>
        </div>
      </div>
    );
  }

  if (screen === "rules") {
    return (
      <div className="min-h-screen bg-felt text-white">
        <div className="max-w-sm mx-auto w-full px-4 py-8 space-y-4">
          <h2 className="text-2xl font-bold text-gold text-center">Pravila</h2>
          <div className="text-sm text-muted space-y-2">
            <p>Igraju 4 igrača. Pri pokretanju partije bira se koje će se igre igrati (od ukupno 9) — svaki igrač bira po jednom svaku izabranu igru. Na kraju partije pobednik je igrač sa najmanje (najnižim brojem) poena.</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="bg-surface border border-rim rounded-lg p-3">
              <div className="font-semibold text-gold mb-1">{GAME_DISPLAY["Što više"]}</div>
              <p className="text-muted">Cilj je odneti što više ruku (od ukupno 8). Svaka odneta ruka nosi -2 poena.</p>
            </div>
            <div className="bg-surface border border-rim rounded-lg p-3">
              <div className="font-semibold text-gold mb-1">{GAME_DISPLAY["Što manje"]}</div>
              <p className="text-muted">Cilj je odneti što manje ruku. Svaka odneta ruka nosi +2 poena. Ako igrač ne odnese nijednu ruku, dobija -16 poena.</p>
            </div>
            <div className="bg-surface border border-rim rounded-lg p-3">
              <div className="font-semibold text-gold mb-1">{GAME_DISPLAY["Što više srca"]}</div>
              <p className="text-muted">Cilj je odneti što više srca (od ukupno 8). Svako odneto srce nosi -2 poena.</p>
            </div>
            <div className="bg-surface border border-rim rounded-lg p-3">
              <div className="font-semibold text-gold mb-1">{GAME_DISPLAY["Što manje srca"]}</div>
              <p className="text-muted">Cilj je odneti što manje srca. Svako odneto srce nosi +2 poena.</p>
            </div>
            <div className="bg-surface border border-rim rounded-lg p-3">
              <div className="font-semibold text-gold mb-1">{GAME_DISPLAY["Dame"]}</div>
              <p className="text-muted">Svaka odneta dama nosi +4 poena. Ako jedan igrač odnese sve 4 dame, dobija -16 poena.</p>
            </div>
            <div className="bg-surface border border-rim rounded-lg p-3">
              <div className="font-semibold text-gold mb-1">{GAME_DISPLAY["J tref"]}</div>
              <p className="text-muted">Igrač koji nosi žandara trefa dobija +16 poena, ostali 0.</p>
            </div>
            <div className="bg-surface border border-rim rounded-lg p-3">
              <div className="font-semibold text-gold mb-1">{GAME_DISPLAY["K srce + zadnja"]}</div>
              <p className="text-muted">Igrač koji nosi K srce dobija +8 poena, a igrač koji nosi zadnju ruku dobija +8 poena. Isti igrač može nositi oba (+16).</p>
            </div>
            <div className="bg-surface border border-rim rounded-lg p-3">
              <div className="font-semibold text-gold mb-1">{GAME_DISPLAY["Tačkice"]}</div>
              <p className="text-muted">
                Igrač koji bira igru određuje početni broj i postavlja prvu kartu tog ranga u jednoj boji. Grade se 4 niza (po jedan za svaku boju) u rastućem cikličnom redosledu od izabranog broja (npr. 9, 10, J, Q, K, A, 7, 8). Igrači naizmenično ili nastavljaju postojeći niz sledećom kartom u toj boji, ili otvaraju novi niz polaganjem početne karte u drugoj boji.
              </p>
              <p className="text-muted mt-2">
                Ako igrač nema kartu koju može da odigra, kaže "dalje" i dobija tačkicu. Pobednik runde je igrač koji prvi ostane bez karata — on dobija -8 poena, a ostali igrači dobijaju zbir svojih tačkica i broja preostalih karata u ruci.
              </p>
              <p className="text-muted mt-2">
                Duplo: ako pobednik odigra poslednju kartu istog ranga kojim je niz otvoren (npr. otvoreno je 9 srce, a poslednja karta pobednika je 9 karo), svi poeni u toj rundi se duplaju.
              </p>
            </div>
            <div className="bg-surface border border-rim rounded-lg p-3">
              <div className="font-semibold text-gold mb-1">{GAME_DISPLAY["Intuicija"]}</div>
              <p className="text-muted">
                Cilj je sakupiti "kvartete" — sve 4 karte istog ranga (npr. 9 herc, karo, tref i pik). Igrač na potezu postavlja drugom igraču pitanja na koja se odgovara samo sa da/ne (npr. "Da li imaš 9?", "Da li je tvoj J crven?", "Da li imaš Q srce?"). Da bi uzeo kartu, mora tačno da pogodi i rang i boju.
              </p>
              <p className="text-muted mt-2">
                Dok dobija potvrdne odgovore, igrač nastavlja da pita — može i drugog igrača, ili promeniti pitanje da zbuni protivnike. Kad sakupi sve 4 karte istog ranga, spušta taj kvartet ispred sebe (-2 poena), i taj rang izlazi iz igre. Runda se završava kad se svih 8 kvarteta sakupi.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setScreen("home")} className="w-full py-3 text-base">
            Nazad
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
          <h2 className="text-base font-semibold text-center text-muted">Unesi imena igrača</h2>
          <div className="space-y-3">
            {players.map((p, idx) => (
              <Input
                key={idx}
                value={p}
                onChange={(e) => handleNameChange(idx, e.target.value)}
                placeholder={`Igrač ${idx + 1}`}
              />
            ))}
          </div>
          {profiles.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-center text-muted">Sačuvani igrači</h2>
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
            Dalje
          </Button>
          <Button variant="outline" onClick={() => setScreen("home")} className="w-full">
            Nazad
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
              Izaberi igre ({selectedGames.length}/{GAMES.length})
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
                  <span className="font-medium">{GAME_DISPLAY[g] ?? g}</span>
                </label>
              ))}
            </div>
            <div className="text-center text-muted text-sm">
              Ukupno rundi: {totalRounds}
            </div>
          </div>
          <Button disabled={!allNamesEntered || selectedGames.length === 0} onClick={startGame} className="w-full py-3 text-base">
            Započni partiju
          </Button>
          <Button variant="outline" onClick={() => setScreen("setup")} className="w-full">
            Nazad
          </Button>
        </div>
      </div>
    );
  }

  const pickerIndex = round % 4;
  const pickerName = players[pickerIndex];

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

  const RoundHistory = () => (
    <div className="overflow-x-auto mt-4">
      <h3 className="font-semibold mb-2 text-gold text-sm">Istorija partije</h3>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="text-muted">
            <th className="border border-rim p-1 text-left">#</th>
            <th className="border border-rim p-1 text-left">Igrač</th>
            <th className="border border-rim p-1 text-left">Igra</th>
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
              <td className="border border-rim p-1">{GAME_DISPLAY[r.game] ?? r.game}</td>
              {r.scores.map((s, j) => (
                <td key={j} className="border border-rim p-1 text-center">{s}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const finished = round >= totalRounds;
  if (finished) {
    return (
      <div className="min-h-screen bg-felt text-white">
        <div className="max-w-sm mx-auto w-full px-4 py-8 space-y-5 text-center">
          <h2 className="text-2xl font-bold text-gold">Partija završena! 🏆</h2>
          <Totals players={players} totals={totals} />
          <RoundHistory />
          <Button variant="outline" onClick={resetGame} className="w-full py-3">Nova partija</Button>
          <Button variant="outline" onClick={() => setScreen("home")} className="w-full py-3">Nazad u meni</Button>
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
            ← Nazad u meni
          </Button>
          <Totals players={players} totals={totals} />
          <div className="text-center">
            <div className="text-muted text-sm">Runda {round + 1} / {totalRounds}</div>
            <div className="text-lg font-bold">
              Bira: <span className="text-gold">{pickerName}</span>
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
                  {GAME_DISPLAY[g] ?? g}
                </Button>
              );
            })}
          </div>
          <RoundHistory />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={undoLastRound} className="flex-1">Poništi rundu</Button>
            <Button variant="destructive" onClick={resetGame} className="flex-1">Resetuj</Button>
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
          ← Nazad u meni
        </Button>
        <Totals players={players} totals={totals} />
        <div className="text-center">
          <div className="text-muted text-sm">Runda {round + 1}</div>
          <div className="text-lg font-bold text-gold">{GAME_DISPLAY[selectedGame] ?? selectedGame}</div>
        </div>
        {selectedGame === "Tačkice" ? (
          <>
            <div className="space-y-2">
              <div className="text-sm text-muted text-center">Tačkice (svaki put kad igrač ne može da odigra)</div>
              <FreeCounter players={players} counts={roundCounts} onChange={adjustFreeCount} />
            </div>
            <PlayerPicker
              players={players}
              label="Ko je ispraznio ruku (pobednik runde)?"
              selected={roundWinner}
              onSelect={setRoundWinner}
            />
            {roundWinner !== null && (
              <div className="space-y-2">
                <div className="text-sm text-muted text-center">Preostale karte u ruci</div>
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
                  Zatvoreno istom kartom kojom je otvoreno (duplo)
                </label>
              </div>
            )}
            <Button
              disabled={roundWinner === null}
              onClick={() => submitScores(tackiceScores)}
              className="w-full py-3 text-base"
            >
              Završi rundu
            </Button>
          </>
        ) : tricksConfig ? (
          <>
            <TrickCounter players={players} counts={roundCounts} total={tricksConfig.total} onChange={adjustCount} />
            <Button
              disabled={tricksSum !== tricksConfig.total}
              onClick={() => submitScores(tricksScores)}
              className="w-full py-3 text-base"
            >
              Završi rundu
            </Button>
          </>
        ) : freeCounterConfig ? (
          <>
            <FreeCounter players={players} counts={roundCounts} onChange={adjustFreeCount} total={freeCounterConfig.total} />
            <Button
              disabled={freeCounterConfig.total !== undefined && freeCounterSum !== freeCounterConfig.total}
              onClick={() => submitScores(freeCounterScores)}
              className="w-full py-3 text-base"
            >
              Završi rundu
            </Button>
          </>
        ) : pickConfig ? (
          <>
            <div className="space-y-4">
              {pickConfig.picks.map((pick, pickIdx) => (
                <PlayerPicker
                  key={pickIdx}
                  players={players}
                  label={pick.label}
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
              Završi rundu
            </Button>
          </>
        ) : null}
        <div className="flex gap-2">
          <Button variant="outline" onClick={undoLastRound} className="flex-1">Poništi rundu</Button>
          <Button variant="destructive" onClick={resetGame} className="flex-1">Resetuj</Button>
        </div>
        <RoundHistory />
      </div>
    </div>
  );
}
