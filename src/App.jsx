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
  const [roundScores, setRoundScores] = useState(["", "", "", ""]);
  const [showHistory, setShowHistory] = useState(false);

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
    }
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
    };
    localStorage.setItem("lora-game", JSON.stringify(data));
  }, [players, started, playedGames, round, selectedGame, results]);

  const resetGame = () => {
    setPlayers(["", "", "", ""]);
    setStarted(false);
    setPlayedGames([]);
    setRound(0);
    setSelectedGame("");
    setResults([]);
    setRoundScores(["", "", "", ""]);
    localStorage.removeItem("lora-game");
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

  const startGame = () => {
    if (allNamesEntered) {
      setPlayedGames(players.map(() => new Set()));
      setRound(0);
      setStarted(true);
      setResults([]);
      setRoundScores(["", "", "", ""]);
    }
  };

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
    if (round === 36) {
      const saved = localStorage.getItem("lora-history") || "[]";
      const parsed = JSON.parse(saved);
      parsed.unshift({ players, results, totals, finishedAt: Date.now() });
      localStorage.setItem("lora-history", JSON.stringify(parsed.slice(0, 20)));
    }
  }, [round]);

  if (!started) {
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
          <Button disabled={!allNamesEntered} onClick={startGame} className="w-full py-3 text-base">
            Započni partiju
          </Button>
          <Button variant="outline" onClick={() => setShowHistory((s) => !s)} className="w-full">
            {showHistory ? "Sakrij istoriju" : "Prikaži istoriju"}
          </Button>
          {showHistory && <History />}
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
  };

  const submitScores = (scores) => {
    setResults((prev) => [...prev, { round, game: selectedGame, scores }]);
    setSelectedGame("");
    setRound((r) => r + 1);
    setRoundScores(["", "", "", ""]);
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
              <td className="border border-rim p-1">{r.game}</td>
              {r.scores.map((s, j) => (
                <td key={j} className="border border-rim p-1 text-center">{s}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const finished = round >= 36;
  if (finished) {
    return (
      <div className="min-h-screen bg-felt text-white">
        <div className="max-w-sm mx-auto w-full px-4 py-8 space-y-5 text-center">
          <h2 className="text-2xl font-bold text-gold">Partija završena! 🏆</h2>
          <Totals players={players} totals={totals} />
          <RoundHistory />
          <Button variant="outline" onClick={resetGame} className="w-full py-3">Nova partija</Button>
        </div>
      </div>
    );
  }

  const already = playedGames[pickerIndex];

  if (!selectedGame) {
    return (
      <div className="min-h-screen bg-felt text-white">
        <div className="max-w-sm mx-auto w-full px-4 py-6 space-y-4">
          <Totals players={players} totals={totals} />
          <div className="text-center">
            <div className="text-muted text-sm">Runda {round + 1} / 36</div>
            <div className="text-lg font-bold">
              Bira: <span className="text-gold">{pickerName}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {GAMES.map((g) => {
              const disabled = already.has(g);
              return (
                <Button
                  key={g}
                  disabled={disabled}
                  variant={disabled ? "outline" : "default"}
                  onClick={() => !disabled && chooseGame(g)}
                  className="w-full py-3"
                >
                  {g}
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

  const handleScoreChange = (idx, val) => {
    if (!/^-?\d*$/.test(val)) return;
    const copy = [...roundScores];
    copy[idx] = val;
    setRoundScores(copy);
  };

  const allScoresEntered = roundScores.every((s) => s.trim() !== "" && !isNaN(Number(s)));

  return (
    <div className="min-h-screen bg-felt text-white">
      <div className="max-w-sm mx-auto w-full px-4 py-6 space-y-4">
        <Totals players={players} totals={totals} />
        <div className="text-center">
          <div className="text-muted text-sm">Runda {round + 1}</div>
          <div className="text-lg font-bold text-gold">{selectedGame}</div>
        </div>
        <div className="space-y-3">
          {players.map((player, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <label className="w-24 text-sm font-medium truncate">{player}</label>
              <Input
                value={roundScores[idx]}
                onChange={(e) => handleScoreChange(idx, e.target.value)}
                className="flex-1"
              />
            </div>
          ))}
        </div>
        <Button
          disabled={!allScoresEntered}
          onClick={() => submitScores(roundScores.map(Number))}
          className="w-full py-3 text-base"
        >
          Završi rundu
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={undoLastRound} className="flex-1">Poništi rundu</Button>
          <Button variant="destructive" onClick={resetGame} className="flex-1">Resetuj</Button>
        </div>
        <RoundHistory />
      </div>
    </div>
  );
}
