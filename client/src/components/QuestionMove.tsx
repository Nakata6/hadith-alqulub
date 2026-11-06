import { useState } from "react";
import type { GameSession } from "@/lib/sessionStorage";

const labels = {
  guess: "خمّن جوابي",
  reverse: "اقلبها عليك",
  together: "جاوب وياي",
} as const;

type Move = NonNullable<GameSession["questionMove"]>;

export function QuestionMove({ player, partner, move, onPlay }: {
  player: string;
  partner: string;
  move?: Move;
  onPlay: (move: Move) => void;
}) {
  const [choosing, setChoosing] = useState(false);
  const instructions = {
    guess: `يا ${partner}، خمّن جواب ${player} أول. وعقب يا ${player}، قول جوابك.`,
    reverse: `يا ${partner}، هالمرة عليك تجاوب عن السؤال مكان ${player}.`,
    together: `يا ${player}، جاوب أول. وعقب يا ${partner}، عطنا جوابك على نفس السؤال.`,
  };
  return <div className="question-move">
    {move ? <p role="status"><strong>{labels[move]}</strong> {instructions[move]}</p> : <>
      <button type="button" aria-expanded={choosing} onClick={() => setChoosing(!choosing)}>العب كرت</button>
      {choosing && <div role="group" aria-label="اختر حركة">
        {(Object.keys(labels) as Move[]).map(key =>
          <button type="button" key={key} onClick={() => onPlay(key)}>{labels[key]}</button>
        )}
      </div>}
    </>}
  </div>;
}
