import { useEffect, useState } from 'react';
import { PACKS } from './data/packs';
import { MAX_PLAYERS, MIN_PLAYERS, createRound, maxImposters, tallyVotes } from './engine/game';
import type { Round } from './engine/game';
import Avatar from './ui/Avatar';
import HoldCard from './ui/HoldCard';
import { isSoundOn, play, setSoundOn, vibrate } from './ui/fx';

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

  const go = (p: Phase) => {
    play('tap');
    setPhase(p);
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
  if (phase === 'reveal') return <Reveal round={round} onDone={() => go('discuss')} />;
  if (phase === 'discuss') return <Discuss round={round} onVote={() => go('vote')} />;
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
      onMenu={() => go('setup')}
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
  const [step, setStep] = useState(0);
  const maxImp = maxImposters(names.length);
  const imp = Math.min(imposters, maxImp);
  const togglePack = (id: string) =>
    setPackIds(packIds.includes(id) ? packIds.filter((p) => p !== id) : [...packIds, id]);
  const resize = (n: number) =>
    setNames(Array.from({ length: n }, (_, i) => names[i] ?? `שחקן ${i + 1}`));
  // Questions: player count, one name per player, categories, imposters.
  const total = names.length + 3;
  const kind = step === 0 ? 'players' : step <= names.length ? 'name' : step === names.length + 1 ? 'packs' : 'imposters';
  const nameIdx = step - 1;
  const last = step === total - 1;
  const canNext = kind !== 'packs' || packIds.length > 0;

  const next = () => {
    play('tap');
    if (last) {
      setImposters(imp);
      onStart();
    } else setStep(step + 1);
  };
  const back = () => {
    play('tap');
    setStep(step - 1);
  };

  return (
    <main className="screen quiz" key={step}>
      <SoundToggle />
      <div className="progress" aria-label={`שאלה ${step + 1} מתוך ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>
      <p className="counter">שאלה {step + 1} מתוך {total}</p>

      {kind === 'players' && (
        <>
          <Avatar seed={0} kind="imposter" size={110} />
          <h1>כמה שחקנים?</h1>
          <p className="sub">{MIN_PLAYERS} עד {MAX_PLAYERS} אנשים על טלפון אחד.</p>
          <div className="stepper big">
            <button className="icon" disabled={names.length <= MIN_PLAYERS} onClick={() => resize(names.length - 1)}>−</button>
            <b>{names.length}</b>
            <button className="icon" disabled={names.length >= MAX_PLAYERS} onClick={() => resize(names.length + 1)}>+</button>
          </div>
        </>
      )}

      {kind === 'name' && (
        <>
          <Avatar seed={nameIdx} size={110} />
          <h1>איך קוראים לשחקן {nameIdx + 1}?</h1>
          <input
            className="bigname"
            autoFocus
            value={names[nameIdx]}
            maxLength={14}
            aria-label={`שם שחקן ${nameIdx + 1}`}
            onChange={(e) => setNames(names.map((x, j) => (j === nameIdx ? e.target.value : x)))}
            onKeyDown={(e) => e.key === 'Enter' && next()}
          />
        </>
      )}

      {kind === 'packs' && (
        <>
          <h1>על מה משחקים?</h1>
          <p className="sub">אפשר לבחור כמה קטגוריות.</p>
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
        </>
      )}

      {kind === 'imposters' && (
        <>
          <Avatar seed={1} kind="imposter" size={110} />
          <h1>כמה מתחזים?</h1>
          <p className="sub">עם {names.length} שחקנים אפשר עד {maxImp}.</p>
          <div className="stepper big">
            <button className="icon" disabled={imp <= 1} onClick={() => setImposters(imp - 1)}>−</button>
            <b>{imp}</b>
            <button className="icon" disabled={imp >= maxImp} onClick={() => setImposters(imp + 1)}>+</button>
          </div>
        </>
      )}

      <div className="nav">
        {step > 0 && (
          <button className="ghost" onClick={back}>חזרה</button>
        )}
        <button className="primary" disabled={!canNext} onClick={next}>
          {last ? 'התחל משחק' : 'הבא'}
        </button>
      </div>
    </main>
  );
}

function SoundToggle() {
  const [on, setOn] = useState(isSoundOn());
  return (
    <button
      className="icon sound"
      aria-label="צלילים ורטט"
      onClick={() => {
        setSoundOn(!on);
        setOn(!on);
        if (!on) play('tap');
      }}
    >
      {on ? '🔊' : '🔇'}
    </button>
  );
}

function Reveal({ round, onDone }: { round: Round; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState(false);
  const player = round.players[index];
  const last = index === round.players.length - 1;

  return (
    <main className="screen center" key={index}>
      <p className="counter">{index + 1} / {round.players.length}</p>
      <Avatar seed={player.id} kind="unknown" size={110} />
      <h1>{player.name}</h1>
      <HoldCard resetKey={index} imposter={player.isImposter} onSeen={() => setSeen(true)}>
        {player.isImposter ? (
          <>
            <Avatar seed={player.id} kind="imposter" size={90} />
            <div className="role">מתחזה</div>
            <p>אתה לא יודע את המילה. התערבב ואל תיתפס.</p>
          </>
        ) : (
          <>
            <Avatar seed={player.id} size={90} />
            <div className="label">המילה הסודית</div>
            <div className="word">{round.word}</div>
            <p>תן רמז של מילה אחת.</p>
          </>
        )}
      </HoldCard>
      <button
        className="primary"
        disabled={!seen}
        onClick={() => {
          play('tap');
          vibrate(20);
          if (last) onDone();
          else {
            setSeen(false);
            setIndex(index + 1);
          }
        }}
      >
        {last ? 'התחילו לשחק' : 'הבא בתור ←'}
      </button>
    </main>
  );
}

function Discuss({ round, onVote }: { round: Round; onVote: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [turn, setTurn] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const n = round.players.length;
  const speaker = round.players[(round.firstSpeaker + turn) % n];
  const roundDone = turn >= n - 1;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <main className="screen center" key={turn}>
      <p className="counter">תור {turn + 1} מתוך {n}</p>
      <Avatar seed={speaker.id} size={110} />
      <h1>{speaker.name}</h1>
      <p className="sub">אומר רמז של מילה אחת.</p>
      <div className="timer">{mm}:{ss}</div>
      {!roundDone ? (
        <button
          className="primary"
          onClick={() => {
            play('tap');
            vibrate(20);
            setTurn(turn + 1);
          }}
        >
          הבא בתור ←
        </button>
      ) : (
        <p className="sub">כולם דיברו. אפשר להצביע.</p>
      )}
      <button className={roundDone ? 'primary' : 'ghost'} disabled={!roundDone} onClick={onVote}>
        {roundDone ? 'עוברים להצבעה' : 'הצבעה (אחרי שכולם מדברים)'}
      </button>
    </main>
  );
}

function Vote({ round, onDone }: { round: Round; onDone: (votes: number[]) => void }) {
  const [votes, setVotes] = useState<number[]>([]);
  const voter = round.players[votes.length];

  return (
    <main className="screen center">
      <p className="counter">{votes.length + 1} / {round.players.length}</p>
      <Avatar seed={voter.id} size={90} />
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
                play('vote');
                vibrate(25);
                const next = [...votes, p.id];
                if (next.length === round.players.length) onDone(next);
                else setVotes(next);
              }}
            >
              <Avatar seed={p.id} size={56} />
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
  useEffect(() => {
    play(res.outcome === 'crew' ? 'win' : 'lose');
    vibrate(res.outcome === 'crew' ? [80, 50, 80, 50, 200] : [300]);
  }, [res.outcome]);

  return (
    <main className="screen center">
      {res.outcome === 'crew' && <Confetti />}
      <h1 className={res.outcome === 'crew' ? 'win' : 'lose'}>
        {res.outcome === 'crew' ? 'הצוות ניצח! 🎉' : 'המתחזה ניצח! 😈'}
      </h1>
      <p className="sub">
        {tie
          ? 'תיקו בהצבעה, אף אחד לא נתפס.'
          : `הקבוצה הצביעה נגד ${round.players[res.top[0]].name}.`}
      </p>
      <div className="card">
        <div className="avatars">
          {round.players.filter((p) => p.isImposter).map((p) => (
            <Avatar key={p.id} seed={p.id} kind="imposter" size={80} />
          ))}
        </div>
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

function Confetti() {
  const colors = ['#e5242b', '#2ecc71', '#f1c40f', '#3498db', '#9b59b6'];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 97) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 9) * 0.12}s`,
            animationDuration: `${2 + (i % 5) * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}
