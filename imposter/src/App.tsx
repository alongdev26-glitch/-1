import { useEffect, useState } from 'react';
import { PACKS } from './data/packs';
import { MAX_PLAYERS, MIN_PLAYERS, ROLE_MIN_PLAYERS, createRound, maxImposters, tallyVotes } from './engine/game';
import type { Role, Round } from './engine/game';
import Avatar from './ui/Avatar';
import HoldCard from './ui/HoldCard';
import { isSoundOn, play, setSoundOn, vibrate } from './ui/fx';

type Phase = 'setup' | 'reveal' | 'discuss' | 'vote' | 'result';

const DEFAULT_NAMES = ['Player 1', 'Player 2', 'Player 3'];

export default function App() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [names, setNames] = useState<string[]>(DEFAULT_NAMES);
  const [packIds, setPackIds] = useState<string[]>([PACKS[0].id]);
  const [imposters, setImposters] = useState(1);
  const [rolesMode, setRolesMode] = useState(false);
  const [round, setRound] = useState<Round | null>(null);
  const [votes, setVotes] = useState<number[]>([]);

  const start = () => {
    const words = PACKS.filter((p) => packIds.includes(p.id)).flatMap((p) => p.words);
    const clean = names.map((n, i) => n.trim() || `Player ${i + 1}`);
    setRound(createRound(clean, words, imposters, Math.random, rolesMode && clean.length >= ROLE_MIN_PLAYERS.jester));
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
        rolesMode={rolesMode}
        setRolesMode={setRolesMode}
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
  rolesMode: boolean;
  setRolesMode: (v: boolean) => void;
  onStart: () => void;
}


function Setup({ names, setNames, packIds, setPackIds, imposters, setImposters, rolesMode, setRolesMode, onStart }: SetupProps) {
  const [step, setStep] = useState(0);
  const maxImp = maxImposters(names.length);
  const imp = Math.min(imposters, maxImp);
  const togglePack = (id: string) =>
    setPackIds(packIds.includes(id) ? packIds.filter((p) => p !== id) : [...packIds, id]);
  const resize = (n: number) =>
    setNames(Array.from({ length: n }, (_, i) => names[i] ?? `Player ${i + 1}`));
  // Questions: player count, one name per player, categories, imposters.
  const total = names.length + 4;
  const kind =
    step === 0 ? 'players' : step <= names.length ? 'name' : step === names.length + 1 ? 'packs' : step === names.length + 2 ? 'mode' : 'imposters';
  const canRoles = names.length >= ROLE_MIN_PLAYERS.jester;
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
      <div className="progress" aria-label={`Question ${step + 1} of ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>
      <p className="counter">Question {step + 1} of {total}</p>

      {kind === 'players' && (
        <>
          <Avatar seed={0} kind="imposter" size={110} />
          <h1>How many players?</h1>
          <p className="sub">{MIN_PLAYERS} to {MAX_PLAYERS} people on one phone.</p>
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
          <h1>What's player {nameIdx + 1}'s name?</h1>
          <input
            className="bigname"
            autoFocus
            value={names[nameIdx]}
            maxLength={14}
            aria-label={`Player ${nameIdx + 1} name`}
            onChange={(e) => setNames(names.map((x, j) => (j === nameIdx ? e.target.value : x)))}
            onKeyDown={(e) => e.key === 'Enter' && next()}
          />
        </>
      )}

      {kind === 'packs' && (
        <>
          <h1>What are you playing?</h1>
          <p className="sub">Pick one or more categories.</p>
          <div className="packs">
            {PACKS.map((p) => (
              <button
                key={p.id}
                className={'pack' + (packIds.includes(p.id) ? ' on' : '')}
                onClick={() => togglePack(p.id)}
              >
                <span className="emoji">{p.emoji}</span>
                {p.name}
                <small>{p.words.length} words</small>
              </button>
            ))}
          </div>
        </>
      )}

      {kind === 'mode' && (
        <>
          <h1>Pick a mode</h1>
          <div className="modes">
            <button className={'mode' + (!rolesMode ? ' on' : '')} onClick={() => setRolesMode(false)}>
              <b>Classic</b>
              <span>One or more imposters. Everyone else shares the secret word.</span>
            </button>
            <button
              className={'mode' + (rolesMode && canRoles ? ' on' : '')}
              disabled={!canRoles}
              onClick={() => setRolesMode(true)}
            >
              <b>Roles</b>
              <span>
                {canRoles
                  ? 'Adds a Jester, plus a Bounty Hunter at 5 players and a Bodyguard at 6.'
                  : `Needs ${ROLE_MIN_PLAYERS.jester}+ players.`}
              </span>
            </button>
          </div>
        </>
      )}

      {kind === 'imposters' && (
        <>
          <Avatar seed={1} kind="imposter" size={110} />
          <h1>How many imposters?</h1>
          <p className="sub">With {names.length} players you can have up to {maxImp}.</p>
          <div className="stepper big">
            <button className="icon" disabled={imp <= 1} onClick={() => setImposters(imp - 1)}>−</button>
            <b>{imp}</b>
            <button className="icon" disabled={imp >= maxImp} onClick={() => setImposters(imp + 1)}>+</button>
          </div>
        </>
      )}

      <div className="nav">
        {step > 0 && (
          <button className="ghost" onClick={back}>Back</button>
        )}
        <button className="primary" disabled={!canNext} onClick={next}>
          {last ? 'Start game' : 'Next'}
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
      aria-label="Sound and vibration"
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

const ROLE_INFO: Record<Role, { title: string; blurb: string }> = {
  imposter: { title: 'Imposter', blurb: 'Blend in with the innocents and avoid suspicion.' },
  innocent: { title: 'Innocent', blurb: 'Work with the group to find and expose the imposters.' },
  jester: { title: 'Jester', blurb: 'Create chaos and misdirection. You win if the group votes you out.' },
  bodyguard: { title: 'Bodyguard', blurb: 'Secretly shield a fellow imposter-team player from suspicion.' },
  bounty: { title: 'Bounty Hunter', blurb: 'Target a specific imposter-team player and work to expose them.' },
};

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
      <HoldCard resetKey={index} role={player.role} onSeen={() => setSeen(true)}>
        <div className="eyebrow">Identity confirmed</div>
        <Avatar seed={player.id} kind={player.role} size={96} />
        <div className="badge">{ROLE_INFO[player.role].title}</div>
        {player.target !== undefined && (
          <div className="target-row">
            <Avatar seed={player.target} kind="unknown" size={30} />
            <span>
              <small>{player.role === 'bodyguard' ? 'Your client' : 'Your target'}</small>
              {round.players[player.target].name}
            </span>
          </div>
        )}
        {player.role !== 'imposter' && (
          <div className="wordbox">
            <small>Secret word</small>
            <b>{round.word}</b>
          </div>
        )}
        <p>{ROLE_INFO[player.role].blurb}</p>
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
        {last ? 'Start playing' : 'Next player →'}
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
      <p className="counter">Turn {turn + 1} of {n}</p>
      <Avatar seed={speaker.id} size={110} />
      <h1>{speaker.name}</h1>
      <p className="sub">Gives a one-word clue.</p>
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
          Next player →
        </button>
      ) : (
        <p className="sub">Everyone has spoken. You can vote now.</p>
      )}
      <button className={roundDone ? 'primary' : 'ghost'} disabled={!roundDone} onClick={onVote}>
        {roundDone ? 'Go to vote' : 'Vote (after everyone speaks)'}
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
      <p className="sub">Who do you think is the imposter?</p>
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
  const tie = res.top.length > 1;
  useEffect(() => {
    const good = res.outcome === 'crew' || res.outcome === 'jester';
    play(good ? 'win' : 'lose');
    vibrate(good ? [80, 50, 80, 50, 200] : [300]);
  }, [res.outcome]);

  return (
    <main className="screen center">
      {res.outcome === 'crew' && <Confetti />}
      <h1 className={res.outcome === 'crew' ? 'win' : 'lose'}>
        {{ crew: 'The crew wins! 🎉', imposter: 'The imposter wins! 😈', jester: 'The jester wins! 🃏' }[res.outcome]}
      </h1>
      <p className="sub">
        {tie
          ? 'The vote was tied, so nobody was caught.'
          : `The group voted out ${round.players[res.top[0]].name}.`}
      </p>
      <div className="card">
        <div className="label">The word was</div>
        <div className="word">{round.word}</div>
        <ul className="roster">
          {round.players.map((p) => (
            <li key={p.id} className={p.role}>
              <Avatar seed={p.id} kind={p.role} size={44} />
              <span className="who">{p.name}</span>
              <span className="what">
                {ROLE_INFO[p.role].title}
                {p.target !== undefined && ` → ${round.players[p.target].name}`}
                {res.bountyHits.includes(p.id) && ' ✓'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <button className="primary" onClick={onAgain}>Play again</button>
      <button className="ghost" onClick={onMenu}>Back to setup</button>
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
