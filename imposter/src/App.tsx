import { useEffect, useState } from 'react';
import { PACKS } from './data/packs';
import { MAX_PLAYERS, MIN_PLAYERS, createRound, maxImposters, tallyVotes } from './engine/game';
import type { Round } from './engine/game';

type Phase = 'setup' | 'reveal' | 'discuss' | 'vote' | 'result';

const DEFAULT_NAMES = ['שחקן 1', 'שחקן 2', 'שחקן 3'];

export default function App() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [names, setNames] = useState<string[]>(DEFAULT_NAMES);
  const [packIds, setPackIds] = useState<string[]>([PACKS[0].id]);
  const [imposters, setImposters] = useState(1);
  const [round, setRound] = useState<Round | null>(null);
  const [votes, setVotes] = useState<number[]>([]);

  const start = () => {
    const words = PACKS.filter((p) => packIds.includes(p.id)).flatMap((p) => p.words);
    const clean = names.map((n, i) => n.trim() || `שחקן ${i + 1}`);
    setRound(createRound(clean, words, imposters));
    setVotes([]);
    setPhase('reveal');
  };

  if (phase === 'setup' || !round) {
    return (
      <Setup
        names={names}
        setNames={setNames}
        packIds={packIds}
        setPackIds={setPackIds}
        imposters={imposters}
        setImposters={setImposters}
        onStart={start}
      />
    );
  }
  if (phase === 'reveal') return <Reveal round={round} onDone={() => setPhase('discuss')} />;
  if (phase === 'discuss') return <Discuss round={round} onVote={() => setPhase('vote')} />;
  if (phase === 'vote') {
    return (
      <Vote
        round={round}
        onDone={(v) => {
          setVotes(v);
          setPhase('result');
        }}
      />
    );
  }
  return (
    <Result
      round={round}
      votes={votes}
      onAgain={start}
      onMenu={() => setPhase('setup')}
    />
  );
}

interface SetupProps {
  names: string[];
  setNames: (n: string[]) => void;
  packIds: string[];
  setPackIds: (p: string[]) => void;
  imposters: number;
  setImposters: (n: number) => void;
  onStart: () => void;
}

function Setup({ names, setNames, packIds, setPackIds, imposters, setImposters, onStart }: SetupProps) {
  const maxImp = maxImposters(names.length);
  const imp = Math.min(imposters, maxImp);
  const togglePack = (id: string) =>
    setPackIds(packIds.includes(id) ? packIds.filter((p) => p !== id) : [...packIds, id]);

  return (
    <main className="screen">
      <h1>מתחזה 🕵️</h1>
      <p className="sub">מי משקר? מצאו את המתחזה לפני שהוא מתערבב.</p>

      <h2>שחקנים ({names.length})</h2>
      <ul className="names">
        {names.map((n, i) => (
          <li key={i}>
            <input
              value={n}
              maxLength={14}
              onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))}
            />
            {names.length > MIN_PLAYERS && (
              <button className="icon" aria-label="הסר" onClick={() => setNames(names.filter((_, j) => j !== i))}>
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
      {names.length < MAX_PLAYERS && (
        <button className="ghost" onClick={() => setNames([...names, `שחקן ${names.length + 1}`])}>
          + הוסף שחקן
        </button>
      )}

      <h2>קטגוריות</h2>
      <div className="packs">
        {PACKS.map((p) => (
          <button
            key={p.id}
            className={'pack' + (packIds.includes(p.id) ? ' on' : '')}
            onClick={() => togglePack(p.id)}
          >
            <span className="emoji">{p.emoji}</span>
            {p.name}
          </button>
        ))}
      </div>

      <h2>מתחזים</h2>
      <div className="stepper">
        <button className="icon" disabled={imp <= 1} onClick={() => setImposters(imp - 1)}>−</button>
        <b>{imp}</b>
        <button className="icon" disabled={imp >= maxImp} onClick={() => setImposters(imp + 1)}>+</button>
      </div>

      <button className="primary" disabled={packIds.length === 0} onClick={onStart}>
        התחל משחק
      </button>
    </main>
  );
}

function Reveal({ round, onDone }: { round: Round; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const player = round.players[index];
  const last = index === round.players.length - 1;

  return (
    <main className="screen center">
      <p className="counter">{index + 1} / {round.players.length}</p>
      <h1>{player.name}</h1>
      {!shown ? (
        <>
          <p className="sub">ודאו שאף אחד אחר לא מסתכל, ואז לחצו.</p>
          <button className="primary" onClick={() => setShown(true)}>הצג את התפקיד שלי</button>
        </>
      ) : (
        <>
          <div className={'card ' + (player.isImposter ? 'imposter' : 'crew')}>
            {player.isImposter ? (
              <>
                <div className="role">מתחזה 🕵️</div>
                <p>אתה לא יודע את המילה. התערבב ואל תיתפס.</p>
              </>
            ) : (
              <>
                <div className="label">המילה הסודית</div>
                <div className="word">{round.word}</div>
                <p>תן רמז של מילה אחת בלי לחשוף יותר מדי.</p>
              </>
            )}
          </div>
          <button
            className="primary"
            onClick={() => {
              setShown(false);
              if (last) onDone();
              else setIndex(index + 1);
            }}
          >
            {last ? 'התחילו לשחק' : 'הבא בתור ←'}
          </button>
        </>
      )}
    </main>
  );
}

function Discuss({ round, onVote }: { round: Round; onVote: () => void }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <main className="screen center">
      <h2>הדיון</h2>
      <div className="timer">{mm}:{ss}</div>
      <p className="sub">
        מתחיל: <b>{round.players[round.firstSpeaker].name}</b>
        <br />
        כל אחד אומר רמז של מילה אחת, ואז מתווכחים.
      </p>
      <button className="primary" onClick={onVote}>עוברים להצבעה</button>
    </main>
  );
}

function Vote({ round, onDone }: { round: Round; onDone: (votes: number[]) => void }) {
  const [votes, setVotes] = useState<number[]>([]);
  const voter = round.players[votes.length];

  return (
    <main className="screen center">
      <p className="counter">{votes.length + 1} / {round.players.length}</p>
      <h1>{voter.name}</h1>
      <p className="sub">מי לדעתך המתחזה?</p>
      <div className="targets">
        {round.players
          .filter((p) => p.id !== voter.id)
          .map((p) => (
            <button
              key={p.id}
              className="target"
              onClick={() => {
                const next = [...votes, p.id];
                if (next.length === round.players.length) onDone(next);
                else setVotes(next);
              }}
            >
              {p.name}
            </button>
          ))}
      </div>
    </main>
  );
}

function Result({
  round,
  votes,
  onAgain,
  onMenu,
}: {
  round: Round;
  votes: number[];
  onAgain: () => void;
  onMenu: () => void;
}) {
  const res = tallyVotes(round, votes);
  const impNames = round.players.filter((p) => p.isImposter).map((p) => p.name).join(', ');
  const tie = res.top.length > 1;

  return (
    <main className="screen center">
      <h1 className={res.outcome === 'crew' ? 'win' : 'lose'}>
        {res.outcome === 'crew' ? 'הצוות ניצח! 🎉' : 'המתחזה ניצח! 😈'}
      </h1>
      <p className="sub">
        {tie
          ? 'תיקו בהצבעה, אף אחד לא נתפס.'
          : `הקבוצה הצביעה נגד ${round.players[res.top[0]].name}.`}
      </p>
      <div className="card">
        <div className="label">המתחזה היה</div>
        <div className="word">{impNames}</div>
        <div className="label">המילה הייתה</div>
        <div className="word">{round.word}</div>
      </div>
      <button className="primary" onClick={onAgain}>סיבוב נוסף</button>
      <button className="ghost" onClick={onMenu}>חזרה להגדרות</button>
    </main>
  );
}
