// Prevodi UI teksta. Interna imena igara (ključevi) ostaju ista (srpska) — koriste se kao ID-jevi.

export const UI_TEXT = {
  sr: {
    home_newGame: "Nova partija",
    home_continueGame: "Nastavi partiju",
    home_rules: "Pravila",
    home_showHistory: "Istorija partija",
    home_hideHistory: "Sakrij istoriju",

    rules_title: "Pravila",
    rules_intro: "Igraju 4 igrača. Pri pokretanju partije bira se koje će se igre igrati (od ukupno 9) — svaki igrač bira po jednom svaku izabranu igru. Na kraju partije pobednik je igrač sa najmanje (najnižim brojem) poena.",
    rules_back: "Nazad",

    setup_enterNames: "Unesi imena igrača",
    setup_playerPlaceholder: "Igrač {n}",
    setup_savedPlayers: "Sačuvani igrači",
    setup_next: "Dalje",
    setup_back: "Nazad",

    setupGames_chooseGames: "Izaberi igre ({n}/{total})",
    setupGames_totalRounds: "Ukupno rundi: {n}",
    setupGames_start: "Započni partiju",

    game_roundOf: "Runda {n} / {total}",
    game_round: "Runda {n}",
    game_picks: "Bira:",
    game_backToMenu: "← Nazad u meni",
    game_undoRound: "Poništi rundu",
    game_reset: "Resetuj",
    game_finishRound: "Završi rundu",
    game_finished: "Partija završena! 🏆",
    game_newGame: "Nova partija",

    history_title: "Istorija partije",
    history_finishedTitle: "Istorija završenih partija",
    history_noGames: "Još nema sačuvanih partija.",
    history_player: "Igrač",
    history_game: "Igra",
    history_results: "Rezultati:",

    counter_total: "Ukupno: {sum} / {total}",

    tackice_label: "Tačkice (svaki put kad igrač ne može da odigra)",
    tackice_winner: "Ko je ispraznio ruku (pobednik runde)?",
    tackice_remaining: "Preostale karte u ruci",
    tackice_double: "Zatvoreno istom kartom kojom je otvoreno (duplo)",
  },
  en: {
    home_newGame: "New game",
    home_continueGame: "Continue game",
    home_rules: "Rules",
    home_showHistory: "Game history",
    home_hideHistory: "Hide history",

    rules_title: "Rules",
    rules_intro: "4 players play. When starting a game, you choose which games will be played (out of 9 total) — each player picks every chosen game exactly once. At the end of the game, the player with the lowest score wins.",
    rules_back: "Back",

    setup_enterNames: "Enter player names",
    setup_playerPlaceholder: "Player {n}",
    setup_savedPlayers: "Saved players",
    setup_next: "Next",
    setup_back: "Back",

    setupGames_chooseGames: "Choose games ({n}/{total})",
    setupGames_totalRounds: "Total rounds: {n}",
    setupGames_start: "Start game",

    game_roundOf: "Round {n} / {total}",
    game_round: "Round {n}",
    game_picks: "Picking:",
    game_backToMenu: "← Back to menu",
    game_undoRound: "Undo round",
    game_reset: "Reset",
    game_finishRound: "Finish round",
    game_finished: "Game finished! 🏆",
    game_newGame: "New game",

    history_title: "Game history",
    history_finishedTitle: "Finished games history",
    history_noGames: "No saved games yet.",
    history_player: "Player",
    history_game: "Game",
    history_results: "Results:",

    counter_total: "Total: {sum} / {total}",

    tackice_label: "Dots (every time a player can't play a card)",
    tackice_winner: "Who emptied their hand (round winner)?",
    tackice_remaining: "Remaining cards in hand",
    tackice_double: "Closed with the same card it was opened with (double)",
  },
};

// Prikaz imena igara sa emoji simbolima, po jeziku
export const GAME_DISPLAY = {
  sr: {
    "Što više": "🔼 Što više",
    "Što manje": "🔽 Što manje",
    "Što više srca": "♥️🔼 Više srca",
    "Što manje srca": "♥️🔽 Manje srca",
    "Dame": "👸 Dame",
    "J tref": "♣️J Žandar",
    "K srce + zadnja": "K♥️+Zadnja",
    "Tačkice": "⚫ Tačkice",
    "Intuicija": "🔮 Intuicija",
  },
  en: {
    "Što više": "🔼 More Tricks",
    "Što manje": "🔽 Fewer Tricks",
    "Što više srca": "♥️🔼 More Hearts",
    "Što manje srca": "♥️🔽 Fewer Hearts",
    "Dame": "👸 Queens",
    "J tref": "♣️J Jack of Clubs",
    "K srce + zadnja": "K♥️+Last Trick",
    "Tačkice": "⚫ Dots",
    "Intuicija": "🔮 Intuition",
  },
};

// Labele za izbor igrača (PICK_CONFIG), po jeziku
export const PICK_LABELS = {
  sr: {
    "J tref": ["Ko nosi žandara trefa?"],
    "K srce + zadnja": ["Ko nosi K srce?", "Ko nosi zadnju ruku?"],
  },
  en: {
    "J tref": ["Who has the jack of clubs?"],
    "K srce + zadnja": ["Who has the K of hearts?", "Who has the last trick?"],
  },
};

// Opisi pravila po igri (lista paragrafa), po jeziku
export const GAME_RULES = {
  sr: {
    "Što više": ["Cilj je odneti što više ruku (od ukupno 8). Svaka odneta ruka nosi -2 poena."],
    "Što manje": ["Cilj je odneti što manje ruku. Svaka odneta ruka nosi +2 poena. Ako igrač ne odnese nijednu ruku, dobija -16 poena."],
    "Što više srca": ["Cilj je odneti što više srca (od ukupno 8). Svako odneto srce nosi -2 poena."],
    "Što manje srca": ["Cilj je odneti što manje srca. Svako odneto srce nosi +2 poena."],
    "Dame": ["Svaka odneta dama nosi +4 poena. Ako jedan igrač odnese sve 4 dame, dobija -16 poena."],
    "J tref": ["Igrač koji nosi žandara trefa dobija +16 poena, ostali 0."],
    "K srce + zadnja": ["Igrač koji nosi K srce dobija +8 poena, a igrač koji nosi zadnju ruku dobija +8 poena. Isti igrač može nositi oba (+16)."],
    "Tačkice": [
      "Igrač koji bira igru određuje početni broj i postavlja prvu kartu tog ranga u jednoj boji. Grade se 4 niza (po jedan za svaku boju) u rastućem cikličnom redosledu od izabranog broja (npr. 9, 10, J, Q, K, A, 7, 8). Igrači naizmenično ili nastavljaju postojeći niz sledećom kartom u toj boji, ili otvaraju novi niz polaganjem početne karte u drugoj boji.",
      "Ako igrač nema kartu koju može da odigra, kaže \"dalje\" i dobija tačkicu. Pobednik runde je igrač koji prvi ostane bez karata — on dobija -8 poena, a ostali igrači dobijaju zbir svojih tačkica i broja preostalih karata u ruci.",
      "Duplo: ako pobednik odigra poslednju kartu istog ranga kojim je niz otvoren (npr. otvoreno je 9 srce, a poslednja karta pobednika je 9 karo), svi poeni u toj rundi se duplaju.",
    ],
    "Intuicija": [
      "Cilj je sakupiti \"kvartete\" — sve 4 karte istog ranga (npr. 9 herc, karo, tref i pik). Igrač na potezu postavlja drugom igraču pitanja na koja se odgovara samo sa da/ne (npr. \"Da li imaš 9?\", \"Da li je tvoj J crven?\", \"Da li imaš Q srce?\"). Da bi uzeo kartu, mora tačno da pogodi i rang i boju.",
      "Dok dobija potvrdne odgovore, igrač nastavlja da pita — može i drugog igrača, ili promeniti pitanje da zbuni protivnike. Kad sakupi sve 4 karte istog ranga, spušta taj kvartet ispred sebe (-2 poena), i taj rang izlazi iz igre. Runda se završava kad se svih 8 kvarteta sakupi.",
    ],
  },
  en: {
    "Što više": ["The goal is to take as many tricks as possible (out of 8 total). Each trick taken is worth -2 points."],
    "Što manje": ["The goal is to take as few tricks as possible. Each trick taken is worth +2 points. If a player takes no tricks at all, they get -16 points."],
    "Što više srca": ["The goal is to take as many hearts as possible (out of 8 total). Each heart taken is worth -2 points."],
    "Što manje srca": ["The goal is to take as few hearts as possible. Each heart taken is worth +2 points."],
    "Dame": ["Each queen taken is worth +4 points. If one player takes all 4 queens, they get -16 points."],
    "J tref": ["The player holding the jack of clubs gets +16 points, everyone else gets 0."],
    "K srce + zadnja": ["The player holding the king of hearts gets +8 points, and the player who takes the last trick gets +8 points. The same player can have both (+16)."],
    "Tačkice": [
      "The player who chose the game picks a starting rank and places the first card of that rank in one suit. Four sequences (one per suit) are built in increasing cyclic order starting from the chosen rank (e.g. 9, 10, J, Q, K, A, 7, 8). On each turn, a player either continues an existing sequence with the next card of that suit, or starts a new sequence by placing the starting-rank card of another suit.",
      "If a player has no card they can play, they say \"pass\" and get a dot. The round winner is the player who empties their hand first — they get -8 points, while the other players get the sum of their dots plus the number of cards remaining in their hand.",
      "Double: if the winner plays their last card of the same rank the sequences were opened with (e.g. opened with 9 of hearts, and the winner's last card is 9 of diamonds), all points for that round are doubled.",
    ],
    "Intuicija": [
      "The goal is to collect \"quartets\" — all 4 cards of the same rank (e.g. 9 of hearts, diamonds, clubs and spades). On their turn, a player asks another player a yes/no question (e.g. \"Do you have a 9?\", \"Is your jack red?\", \"Do you have the queen of hearts?\"). To take a card, they must correctly guess both the rank and the suit.",
      "As long as they get \"yes\" answers, the player keeps asking — they can ask a different player, or change the question to confuse opponents. Once a player collects all 4 cards of a rank, they place that quartet in front of them (-2 points), and that rank is out of play. The round ends once all 8 quartets are collected.",
    ],
  },
};
