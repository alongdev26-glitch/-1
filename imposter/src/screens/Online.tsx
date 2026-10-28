import { useEffect, useRef, useState } from 'react';
import { PACKS } from '../data/packs';
import { MIN_PLAYERS, ROLE_MIN_PLAYERS, maxImposters } from '../engine/game';
import { useLang } from '../i18n';
import { openGuest, openHost } from '../online/peer';
import type { NetError, Session } from '../online/peer';
import { cleanCode } from '../online/room';
import type { Settings, View } from '../online/room';
import Avatar from '../ui/Avatar';
import HoldCard from '../ui/HoldCard';
import Icon from '../ui/icons';
import { play, vibrate } from '../ui/fx';
import { Confetti, SoundToggle } from '../ui/shared';

const MIN_PACKS = 3;

interface Props {
  mode: 'host' | 'join';
  initialCode?: string;
  defaultName: string;
  settings: Settings;
  onExit: () => void;
}

export default function Online({ mode, initialCode = '', defaultName, settings, onExit }: Props) {
  const { t } = useLang();
  const [name, setName] = useState(defaultName);
  const [code, setCode] = useState(cleanCode(initialCode));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<View | null>(null);
  const session = useRef<Session | null>(null);

  useEffect(() => () => session.current?.close(), []);

  const leave = () => {
    session.current?.close();
    session.current = null;
    onExit();
  };

  const errText = (c: NetError) =>
    ({ net: t.o.errNet, notfound: t.o.errNotFound, full: t.o.errFull, started: t.o.errStarted })[c];

  const connect = async () => {
    setBusy(true);
    setError('');
    const cb = {
      onView: setView,
      onClosed: () => {
        session.current?.close();
        session.current = null;
        setView(null);
        setError(t.o.hostLeft);
      },
    };
    try {
      const display = name.trim() || t.player(1);
      session.current = mode === 'host' ? await openHost(display, settings, cb) : await openGuest(code, display, cb);
      play('tap');
    } catch (e) {
      setError(errText(((e as { code?: NetError }).code ?? 'net') as NetError));
    }
    setBusy(false);
  };

  if (!view || !session.current) {
    const canGo = !busy && (mode === 'host' || code.length === 4);
    return (
      <main className="screen quiz">
        <SoundToggle />
        <Avatar seed={mode === 'host' ? 2 : 3} kind={mode === 'host' ? 'innocent' : 'unknown'} size={110} />
        <h1>{mode === 'host' ? t.o.createRoom : t.o.joinRoom}</h1>
        <label className="field">
          <span>{t.o.yourName}</span>
          <input value={name} maxLength={14} placeholder={t.player(1)} onChange={(e) => setName(e.target.value)} />
        </label>
        {mode === 'join' && (
          <label className="field">
            <span>{t.o.roomCode}</span>
            <input
              className="codeinput"
              dir="ltr"
              value={code}
              maxLength={4}
              autoCapitalize="characters"
              placeholder="ABCD"
              onChange={(e) => setCode(cleanCode(e.target.value))}
            />
          </label>
        )}
        {error && <p className="error">{error}</p>}
        <div className="nav">
          <button className="ghost" onClick={leave}>{t.back}</button>
          <button className="primary" disabled={!canGo} onClick={connect}>
            {busy ? t.o.connecting : mode === 'host' ? t.o.create : t.o.join}
          </button>
        </div>
      </main>
    );
  }

  const s = session.current;
  switch (view.phase) {
    case 'lobby':
      return <Lobby view={view} session={s} onLeave={leave} />;
    case 'reveal':
      return <RevealOnline key={view.roundNo} view={view} session={s} />;
    case 'discuss':
      return <DiscussOnline view={view} session={s} />;
    case 'vote':
      return <VoteOnline view={view} session={s} />;
    default:
      return <ResultOnline view={view} session={s} onLeave={leave} />;
  }
}

function Lobby({ view, session, onLeave }: { view: View; session: Session; onLeave: () => void }) {
  const { lang, t } = useLang();
  const [copied, setCopied] = useState(false);
  const n = view.players.length;
  const st = view.settings;
  const maxImp = maxImposters(n);
  const imp = Math.min(st.imposters, maxImp);
  const canRoles = n >= ROLE_MIN_PLAYERS.jester;
  const set = (patch: Partial<Settings>) => session.dispatch({ t: 'settings', settings: { ...st, imposters: imp, ...patch } });
  const toggle = (id: string) =>
    set({ packIds: st.packIds.includes(id) ? st.packIds.filter((p) => p !== id) : [...st.packIds, id] });
  const ready = n >= MIN_PLAYERS && st.packIds.length >= MIN_PACKS;

  const copy = async () => {
    const link = `${location.origin}${location.pathname}?room=${view.code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: the code is on screen anyway */
    }
  };

  return (
    <main className="screen quiz">
      <SoundToggle />
      <p className="counter">{t.o.lobby}</p>
      <div className="codecard">
        <small>{t.o.shareCode}</small>
        <b dir="ltr">{view.code}</b>
        <button className="ghost" onClick={copy}>{copied ? t.o.copied : t.o.copyLink}</button>
      </div>

      <ul className="names players">
        {view.players.map((p) => (
          <li key={p.id}>
            <Avatar seed={p.id} size={40} />
            <span className="who">{p.name || t.player(p.id + 1)}</span>
            {p.host && <em>{t.o.host}</em>}
            {p.id === view.me && <em>{t.o.you}</em>}
          </li>
        ))}
      </ul>

      {view.isHost ? (
        <>
          <p className="sub">{t.packsSub} · {t.packsMin(MIN_PACKS, st.packIds.length)}</p>
          <div className="packs">
            {PACKS.map((p) => (
              <button key={p.id} className={'pack' + (st.packIds.includes(p.id) ? ' on' : '')} onClick={() => toggle(p.id)}>
                <Icon name={p.icon} />
                {p.name[lang]}
              </button>
            ))}
          </div>
          <div className="modes">
            <button className={'mode' + (!st.rolesMode ? ' on' : '')} onClick={() => set({ rolesMode: false })}>
              <b>{t.classic}</b>
            </button>
            <button className={'mode' + (st.rolesMode && canRoles ? ' on' : '')} disabled={!canRoles} onClick={() => set({ rolesMode: true })}>
              <b>{t.roles}</b>
              {!canRoles && <span>{t.rolesNeed(ROLE_MIN_PLAYERS.jester)}</span>}
            </button>
          </div>
          <div className="stepper">
            <span className="sub">{t.impQ}</span>
            <button className="icon" disabled={imp <= 1} onClick={() => set({ imposters: imp - 1 })}>−</button>
            <b>{imp}</b>
            <button className="icon" disabled={imp >= maxImp} onClick={() => set({ imposters: imp + 1 })}>+</button>
          </div>
          {n < MIN_PLAYERS && <p className="sub">{t.o.needPlayers(MIN_PLAYERS - n)}</p>}
          <button
            className="primary"
            disabled={!ready}
            onClick={() => {
              const words = PACKS.filter((p) => st.packIds.includes(p.id)).flatMap((p) => p.words[lang]);
              session.dispatch({ t: 'start', words });
            }}
          >
            {t.startGame}
          </button>
        </>
      ) : (
        <p className="sub">{t.o.waitingHost}</p>
      )}
      <button className="ghost" onClick={onLeave}>{t.o.leave}</button>
    </main>
  );
}

function RevealOnline({ view, session }: { view: View; session: Session }) {
  const { t } = useLang();
  const [seen, setSeen] = useState(false);
  const [sent, setSent] = useState(false);
  const you = view.you;
  const me = view.players[view.me];
  if (!you || !me) return null;
  const info = t.roleInfo[you.role];
  // PeerJS turns undefined into null on the wire, so test with != null.
  const target = you.target != null ? view.players[you.target] : undefined;

  return (
    <main className="screen center">
      <SoundToggle />
      <p className="counter" dir="ltr">{view.readyCount} / {view.total}</p>
      <Avatar seed={me.id} kind="unknown" size={110} />
      <h1>{me.name}</h1>
      <HoldCard resetKey={0} role={you.role} onSeen={() => setSeen(true)}>
        <div className="eyebrow">{t.eyebrow}</div>
        <Avatar seed={me.id} kind={you.role} size={96} />
        <div className="badge">{info.title}</div>
        {target && (
          <div className="target-row">
            <Avatar seed={target.id} kind="unknown" size={30} />
            <span>
              <small>{you.role === 'bodyguard' ? t.yourClient : t.yourTarget}</small>
              {target.name}
            </span>
          </div>
        )}
        {you.word && (
          <div className="wordbox">
            <small>{t.secretWord}</small>
            <b>{you.word}</b>
          </div>
        )}
        <p>{info.blurb}</p>
      </HoldCard>
      {sent ? (
        <p className="sub">{t.o.waitingOthers(view.readyCount, view.total)}</p>
      ) : (
        <button
          className="primary"
          disabled={!seen}
          onClick={() => {
            play('tap');
            vibrate(20);
            setSent(true);
            session.dispatch({ t: 'ready' });
          }}
        >
          {t.o.ready}
        </button>
      )}
    </main>
  );
}

function DiscussOnline({ view, session }: { view: View; session: Session }) {
  const { t } = useLang();
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const n = view.players.length;
  const speaker = view.players[view.speaker];
  const roundDone = view.turn >= n - 1;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <main className="screen center" key={`${view.roundNo}-${view.turn}`}>
      <SoundToggle />
      <p className="counter">{view.roundNo > 1 && `${t.roundLabel(view.roundNo)} · `}{t.turn(view.turn + 1, n)}</p>
      <Avatar seed={speaker.id} size={110} />
      <h1>{speaker.name}{speaker.id === view.me && ` (${t.o.you})`}</h1>
      <p className="sub">{t.givesClue}</p>
      <div className="timer" dir="ltr">{mm}:{ss}</div>
      {view.isHost ? (
        <>
          {!roundDone ? (
            <button className="primary" onClick={() => { play('tap'); vibrate(20); session.dispatch({ t: 'next' }); }}>
              {t.nextPlayer} {t.arrow}
            </button>
          ) : (
            <>
              <p className="sub">{t.allSpoke}</p>
              <button className="primary" onClick={() => { play('tap'); session.dispatch({ t: 'tovote' }); }}>{t.goVote}</button>
              <button className="ghost" onClick={() => { play('tap'); session.dispatch({ t: 'again' }); }}>{t.anotherRound}</button>
            </>
          )}
        </>
      ) : (
        <p className="sub">{roundDone ? t.allSpoke : t.o.waitingHostAction}</p>
      )}
    </main>
  );
}

function VoteOnline({ view, session }: { view: View; session: Session }) {
  const { t } = useLang();
  const me = view.players[view.me];
  if (view.voted) {
    return (
      <main className="screen center">
        <SoundToggle />
        <Avatar seed={view.me} size={90} />
        <p className="sub">{t.o.voteSent}</p>
        <p className="counter" dir="ltr">{view.votedCount} / {view.total}</p>
      </main>
    );
  }
  return (
    <main className="screen center">
      <SoundToggle />
      <Avatar seed={view.me} size={90} />
      <h1>{me?.name}</h1>
      <p className="sub">{t.whoImposter}</p>
      <div className="targets">
        {view.players
          .filter((p) => p.id !== view.me && !p.gone)
          .map((p) => (
            <button
              key={p.id}
              className="target"
              onClick={() => {
                play('vote');
                vibrate(25);
                session.dispatch({ t: 'vote', target: p.id });
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

function ResultOnline({ view, session, onLeave }: { view: View; session: Session; onLeave: () => void }) {
  const { t } = useLang();
  const res = view.result;
  const outcome = res?.outcome;
  useEffect(() => {
    if (!outcome) return;
    const good = outcome === 'crew' || outcome === 'jester';
    play(good ? 'win' : 'lose');
    vibrate(good ? [80, 50, 80, 50, 200] : [300]);
  }, [outcome]);
  if (!res) return null;
  const hit = new Set(res.roster.filter((r) => r.hit).map((r) => r.id));

  return (
    <main className="screen center">
      {res.outcome === 'crew' && <Confetti />}
      <h1 className={res.outcome === 'crew' ? 'win' : 'lose'}>
        {{ crew: t.crewWins, imposter: t.imposterWins, jester: t.jesterWins }[res.outcome]}
      </h1>
      <p className="sub">{res.top.length === 1 ? t.votedOut(view.players[res.top[0]].name) : t.tie}</p>
      <div className="card">
        <div className="label">{t.wordWas}</div>
        <div className="word">{res.word}</div>
        <ul className="roster">
          {res.roster.map((r) => (
            <li key={r.id} className={r.role}>
              <Avatar seed={r.id} kind={r.role} size={44} />
              <span className="who">{view.players[r.id].name}</span>
              <span className="what">
                {t.roleInfo[r.role].title}
                {r.target != null && ` ${t.arrow} ${view.players[r.target].name}`}
                {hit.has(r.id) && ' ✓'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {view.isHost ? (
        <button className="primary" onClick={() => session.dispatch({ t: 'lobby' })}>{t.playAgain}</button>
      ) : (
        <p className="sub">{t.o.waitingHostAction}</p>
      )}
      <button className="ghost" onClick={onLeave}>{t.o.leave}</button>
    </main>
  );
}

