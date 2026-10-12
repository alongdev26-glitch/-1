import { useEffect, useState } from 'react';
import { PACKS } from './data/packs';
import { MAX_PLAYERS, MIN_PLAYERS, ROLE_MIN_PLAYERS, createRound, maxImposters, tallyVotes } from './engine/game';
import type { Round } from './engine/game';
import { LANG_OPTIONS, LangProvider, useLang } from './i18n';
import Avatar from './ui/Avatar';
import HoldCard from './ui/HoldCard';
import Online from './screens/Online';
import { cleanCode } from './online/room';
import { play, vibrate } from './ui/fx';
import { Confetti, SoundToggle } from './ui/shared';

type Phase = 'setup' | 'reveal' | 'discuss' | 'vote' | 'result';

export default function App() {
  return (
    <LangProvider>
      <Game />
    </LangProvider>
  );
}

interface Saved {
  names: string[];
  packIds: string[];
  imposters: number;
  rolesMode: boolean;
}

const SAVE_KEY = 'imposter.setup';

/** Last setup, so a group does not have to retype names every round. */
function loadSaved(): Partial<Saved> {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}') as Partial<Saved>;
    const names = Array.isArray(raw.names) ? raw.names.slice(0, MAX_PLAYERS).map((n) => String(n).slice(0, 14)) : undefined;
    return {
      names: names && names.length >= MIN_PLAYERS ? names : undefined,
      packIds: Array.isArray(raw.packIds) ? raw.packIds.filter((id) => PACKS.some((p) => p.id === id)) : undefined,
      imposters: typeof raw.imposters === 'number' ? raw.imposters : undefined,
      rolesMode: raw.rolesMode === true,
    };
  } catch {
    return {};
  }
}

function Game() {
  const { lang, t } = useLang();
  const [saved] = useState(loadSaved);
  const [phase, setPhase] = useState<Phase>('setup');
  // An empty name means "use the default for the chosen language".
  const [names, setNames] = useState<string[]>(saved.names ?? ['', '', '']);
  const [packIds, setPackIds] = useState<string[]>(
    saved.packIds && saved.packIds.length >= MIN_PACKS ? saved.packIds : PACKS.slice(0, MIN_PACKS).map((p) => p.id),
  );
  const [imposters, setImposters] = useState(saved.imposters ?? 1);
  const [rolesMode, setRolesMode] = useState(saved.rolesMode ?? false);

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ names, packIds, imposters, rolesMode }));
    } catch {
      /* storage unavailable */
    }
  }, [names, packIds, imposters, rolesMode]);
  const [online, setOnline] = useState<{ mode: 'host' | 'join'; code: string } | null>(() => {
    const code = cleanCode(new URLSearchParams(location.search).get('room') ?? '');
    return code.length === 4 ? { mode: 'join', code } : null;
  });
  const [round, setRound] = useState<Round | null>(null);
  const [votes, setVotes] = useState<number[]>([]);

  const start = () => {
    const words = PACKS.filter((p) => packIds.includes(p.id)).flatMap((p) => p.words[lang]);
    const clean = names.map((n, i) => n.trim() || t.player(i + 1));
    setRound(createRound(clean, words, imposters, Math.random, rolesMode && clean.length >= ROLE_MIN_PLAYERS.jester));
    setVotes([]);
    setPhase('reveal');
  };

  const go = (p: Phase) => {
    play('tap');
    setPhase(p);
  };

  if (online) {
    return (
      <Online
        mode={online.mode}
        initialCode={online.code}
        defaultName={names[0]}
        settings={{ packIds, rolesMode, imposters }}
        onExit={() => {
          history.replaceState(null, '', location.pathname);
          setOnline(null);
        }}
      />
    );
  }

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
        onOnline={(mode) => setOnline({ mode, code: '' })}
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
  return <Result round={round} votes={votes} onAgain={start} onMenu={() => go('setup')} />;
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
  onOnline: (mode: 'host' | 'join') => void;
}

const MIN_PACKS = 3;

function Setup({ names, setNames, packIds, setPackIds, imposters, setImposters, rolesMode, setRolesMode, onStart, onOnline }: SetupProps) {
  const { lang, setLang, t } = useLang();
  const [step, setStep] = useState(0);
  const [where, setWhere] = useState<'phone' | 'host' | 'join'>('phone');
  const maxImp = maxImposters(names.length);
  const imp = Math.min(imposters, maxImp);
  const togglePack = (id: string) =>
    setPackIds(packIds.includes(id) ? packIds.filter((p) => p !== id) : [...packIds, id]);
  const resize = (n: number) => setNames(Array.from({ length: n }, (_, i) => names[i] ?? ''));

  // Questions: language, where to play, player count, one name per player, categories, mode, imposters.
  const n = names.length;
  const total = n + 6;
  const kind =
    step === 0 ? 'lang' : step === 1 ? 'where' : step === 2 ? 'players' : step <= n + 2 ? 'name' : step === n + 3 ? 'packs' : step === n + 4 ? 'mode' : 'imposters';
  const nameIdx = step - 3;
  const canRoles = n >= ROLE_MIN_PLAYERS.jester;
  const last = step === total - 1;
  const canNext = kind !== 'packs' || packIds.length >= MIN_PACKS;

  const next = () => {
    play('tap');
    if (kind === 'where' && where !== 'phone') onOnline(where);
    else if (last) {
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
      <div className="progress" aria-label={t.question(step + 1, total)}>
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>
      <p className="counter">{t.question(step + 1, total)}</p>

      {kind === 'lang' && (
        <>
          <Avatar seed={0} kind="imposter" size={120} />
          <h1>Imposter</h1>
          <p className="sub">Language · שפה · لغة</p>
          <div className="langs">
            {LANG_OPTIONS.map((l) => (
              <button key={l.id} className={'mode' + (lang === l.id ? ' on' : '')} onClick={() => { play('tap'); setLang(l.id); }}>
                <b>{l.label}</b>
              </button>
            ))}
          </div>
        </>
      )}

      {kind === 'where' && (
        <>
          <Avatar seed={4} kind="innocent" size={110} />
          <h1>{t.o.howPlay}</h1>
          <div className="modes">
            {([
              ['phone', t.o.onePhone, t.o.onePhoneDesc],
              ['host', t.o.createRoom, t.o.createRoomDesc],
              ['join', t.o.joinRoom, t.o.joinRoomDesc],
            ] as const).map(([id, title, desc]) => (
              <button key={id} className={'mode' + (where === id ? ' on' : '')} onClick={() => { play('tap'); setWhere(id); }}>
                <b>{title}</b>
                <span>{desc}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {kind === 'players' && (
        <>
          <Avatar seed={1} kind="innocent" size={110} />
          <h1>{t.howMany}</h1>
          <p className="sub">{t.howManySub(MIN_PLAYERS, MAX_PLAYERS)}</p>
          <div className="stepper big">
            <button className="icon" disabled={n <= MIN_PLAYERS} onClick={() => resize(n - 1)}>−</button>
            <b>{n}</b>
            <button className="icon" disabled={n >= MAX_PLAYERS} onClick={() => resize(n + 1)}>+</button>
          </div>
        </>
      )}

      {kind === 'name' && (
        <>
          <Avatar seed={nameIdx} size={110} />
          <h1>{t.nameQ(nameIdx + 1)}</h1>
          <input
            className="bigname"
            autoFocus
            value={names[nameIdx]}
            placeholder={t.player(nameIdx + 1)}
            maxLength={14}
            aria-label={t.nameAria(nameIdx + 1)}
            onChange={(e) => setNames(names.map((x, j) => (j === nameIdx ? e.target.value : x)))}
            onKeyDown={(e) => e.key === 'Enter' && next()}
          />
        </>
      )}

      {kind === 'packs' && (
        <>
          <h1>{t.packsQ}</h1>
          <p className="sub">{t.packsSub} · {t.packsMin(MIN_PACKS, packIds.length)}</p>
          <div className="packs">
            {PACKS.map((p) => (
              <button
                key={p.id}
                className={'pack' + (packIds.includes(p.id) ? ' on' : '')}
                onClick={() => togglePack(p.id)}
              >
                <span className="emoji">{p.emoji}</span>
                {p.name[lang]}
                <small>{t.words(p.words[lang].length)}</small>
              </button>
            ))}
          </div>
        </>
      )}

      {kind === 'mode' && (
        <>
          <h1>{t.modeQ}</h1>
          <div className="modes">
            <button className={'mode' + (!rolesMode ? ' on' : '')} onClick={() => setRolesMode(false)}>
              <b>{t.classic}</b>
              <span>{t.classicDesc}</span>
            </button>
            <button
              className={'mode' + (rolesMode && canRoles ? ' on' : '')}
              disabled={!canRoles}
              onClick={() => setRolesMode(true)}
            >
              <b>{t.roles}</b>
              <span>{canRoles ? t.rolesDesc : t.rolesNeed(ROLE_MIN_PLAYERS.jester)}</span>
            </button>
          </div>
        </>
      )}

      {kind === 'imposters' && (
        <>
          <Avatar seed={1} kind="imposter" size={110} />
          <h1>{t.impQ}</h1>
          <p className="sub">{t.impSub(n, maxImp)}</p>
          <div className="stepper big">
            <button className="icon" disabled={imp <= 1} onClick={() => setImposters(imp - 1)}>−</button>
            <b>{imp}</b>
            <button className="icon" disabled={imp >= maxImp} onClick={() => setImposters(imp + 1)}>+</button>
          </div>
        </>
      )}

      <div className="nav">
        {step > 0 && (
          <button className="ghost" onClick={back}>{t.back}</button>
        )}
        <button className="primary" disabled={!canNext} onClick={next}>
          {last ? t.startGame : t.next}
        </button>
      </div>
    </main>
  );
}

function Reveal({ round, onDone }: { round: Round; onDone: () => void }) {
  const { t } = useLang();
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState(false);
  const player = round.players[index];
  const last = index === round.players.length - 1;
  const info = t.roleInfo[player.role];

  return (
    <main className="screen center" key={index}>
      <p className="counter" dir="ltr">{index + 1} / {round.players.length}</p>
      <Avatar seed={player.id} kind="unknown" size={110} />
      <h1>{player.name}</h1>
      <HoldCard resetKey={index} role={player.role} onSeen={() => setSeen(true)}>
        <div className="eyebrow">{t.eyebrow}</div>
        <Avatar seed={player.id} kind={player.role} size={96} />
        <div className="badge">{info.title}</div>
        {player.target !== undefined && (
          <div className="target-row">
            <Avatar seed={player.target} kind="unknown" size={30} />
            <span>
              <small>{player.role === 'bodyguard' ? t.yourClient : t.yourTarget}</small>
              {round.players[player.target].name}
            </span>
          </div>
        )}
        {player.role !== 'imposter' && (
          <div className="wordbox">
            <small>{t.secretWord}</small>
            <b>{round.word}</b>
          </div>
        )}
        <p>{info.blurb}</p>
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
        {last ? t.startPlaying : `${t.nextPlayer} ${t.arrow}`}
      </button>
    </main>
  );
}

function Discuss({ round, onVote }: { round: Round; onVote: () => void }) {
  const { t } = useLang();
  const [seconds, setSeconds] = useState(0);
  const [turn, setTurn] = useState(0);
  const [roundNo, setRoundNo] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const n = round.players.length;
  const speaker = round.players[(round.firstSpeaker + turn) % n];
  const roundDone = turn >= n - 1;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <main className="screen center" key={`${roundNo}-${turn}`}>
      <p className="counter">{roundNo > 1 && `${t.roundLabel(roundNo)} · `}{t.turn(turn + 1, n)}</p>
      <Avatar seed={speaker.id} size={110} />
      <h1>{speaker.name}</h1>
      <p className="sub">{t.givesClue}</p>
      <div className="timer" dir="ltr">{mm}:{ss}</div>
      {!roundDone ? (
        <button
          className="primary"
          onClick={() => {
            play('tap');
            vibrate(20);
            setTurn(turn + 1);
          }}
        >
          {t.nextPlayer} {t.arrow}
        </button>
      ) : (
        <p className="sub">{t.allSpoke}</p>
      )}
      <button className={roundDone ? 'primary' : 'ghost'} disabled={!roundDone} onClick={onVote}>
        {roundDone ? t.goVote : t.voteLocked}
      </button>
      {roundDone && (
        <button
          className="ghost"
          onClick={() => {
            play('tap');
            setTurn(0);
            setRoundNo(roundNo + 1);
          }}
        >
          {t.anotherRound}
        </button>
      )}
    </main>
  );
}

function Vote({ round, onDone }: { round: Round; onDone: (votes: number[]) => void }) {
  const { t } = useLang();
  const [votes, setVotes] = useState<number[]>([]);
  const voter = round.players[votes.length];

  return (
    <main className="screen center">
      <p className="counter" dir="ltr">{votes.length + 1} / {round.players.length}</p>
      <Avatar seed={voter.id} size={90} />
      <h1>{voter.name}</h1>
      <p className="sub">{t.whoImposter}</p>
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
  const { t } = useLang();
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
        {{ crew: t.crewWins, imposter: t.imposterWins, jester: t.jesterWins }[res.outcome]}
      </h1>
      <p className="sub">{tie ? t.tie : t.votedOut(round.players[res.top[0]].name)}</p>
      <div className="card">
        <div className="label">{t.wordWas}</div>
        <div className="word">{round.word}</div>
        <ul className="roster">
          {round.players.map((p) => (
            <li key={p.id} className={p.role}>
              <Avatar seed={p.id} kind={p.role} size={44} />
              <span className="who">{p.name}</span>
              <span className="what">
                {t.roleInfo[p.role].title}
                {p.target !== undefined && ` ${t.arrow} ${round.players[p.target].name}`}
                {res.bountyHits.includes(p.id) && ' ✓'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <button className="primary" onClick={onAgain}>{t.playAgain}</button>
      <button className="ghost" onClick={onMenu}>{t.backToSetup}</button>
    </main>
  );
}
