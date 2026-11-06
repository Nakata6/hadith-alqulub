import { useState } from "react";
import { moveAvailableRound, type GameSession, type Move } from "@/lib/sessionStorage";

const labels = {
  guess: "خمّن جوابي",
  reverse: "اقلبها عليك",
  together: "جاوب وياي",
} as const;

export function QuestionMove({ session, onPlay }: {
  session: GameSession;
  onPlay: (move: Move) => void;
}) {
  const move = session.questionMove;
  const player = session.players[session.currentPlayer];
  const partner = session.players[1 - session.currentPlayer];
  const [choosing, setChoosing] = useState(false);
  const instructions = {
    guess: `يا ${partner}، خمّن جواب ${player} أول. وعقب يا ${player}، قول جوابك.`,
    reverse: `يا ${partner}، هالمرة عليك تجاوب عن السؤال مكان ${player}.`,
    together: `يا ${player}، جاوب أول. وعقب يا ${partner}، عطنا جوابك على نفس السؤال.`,
  };
  return <div className="question-move">
    {move ? <p role="status"><strong>{labels[move]}</strong> {instructions[move]}</p> : <>
      <button type="button" className="secondary-button" aria-expanded={choosing} onClick={() => setChoosing(!choosing)}>العب كرت</button>
      {choosing && <div role="group" aria-label="اختر حركة">
        {(Object.keys(labels) as Move[]).map(key => {
          const round = moveAvailableRound(session, key);
          const locked = session.roundNumber < round;
          return <button type="button" key={key} disabled={locked} onClick={() => onPlay(key)}>
            {labels[key]}{locked && <small>تعود في الجولة {round}</small>}
          </button>;
        })}
      </div>}
    </>}
  </div>;
}
