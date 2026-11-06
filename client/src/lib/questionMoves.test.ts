import { expect, it } from "vitest";
import { parseSession, playMove } from "./sessionStorage";

it("tracks each move per player across reloads and unlocks after two deals", () => {
  const card = { id: "1", prompt: "سؤال", level: "nabd" };
  const session = parseSession({ version: 2, players: ["أ", "ب"], currentPlayer: 0, round: [], roundDeck: [card], activeCard: card })!;
  const played = playMove(session, "guess");
  expect(playMove(played, "reverse")).toBe(played);
  const next = { ...parseSession(JSON.parse(JSON.stringify(played)))!, questionMove: undefined };
  expect(playMove(next, "guess")).toBe(next);
  expect(playMove(next, "reverse").questionMove).toBe("reverse");
  expect(playMove({ ...next, currentPlayer: 1 }, "guess").questionMove).toBe("guess");
  expect(playMove({ ...next, roundNumber: 2 }, "guess").questionMove).toBeUndefined();
  expect(playMove({ ...next, roundNumber: 3 }, "guess").questionMove).toBe("guess");
  expect(parseSession({ ...session, questionMove: "together" })?.moveRounds).toEqual([{ together: 1 }, {}]);
});
