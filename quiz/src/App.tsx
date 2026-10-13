import { useState } from 'react';
import { TOPICS, type Question, type Topic } from './data/questions';
import { gradeMessage, isCorrect, pickQuestions, scorePercent, wrongQuestions, type Answer } from './engine/quiz';
import { addHistory, clearHistory, loadHistory, type HistoryEntry } from './engine/history';

interface Session {
  questions: Question[];
  answers: Answer[];
  label: string;
  retry: boolean;
}

const COUNTS = [5, 10, 15];

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  const start = (questions: Question[], label: string, retry = false) => {
    setSession({ questions, answers: [], label, retry });
    setDone(false);
  };

  const finish = (answers: Answer[]) => {
    if (!session) return;
    const correct = session.questions.filter((q, i) => isCorrect(q, answers[i]!)).length;
    if (!session.retry) {
      setHistory(addHistory({ date: new Date().toISOString(), topic: session.label, correct, total: session.questions.length }));
    }
    setSession({ ...session, answers });
    setDone(true);
  };

  if (session && !done) return <QuestionScreen key={session.questions.map((q) => q.id).join()} session={session} onFinish={finish} />;
  if (session && done) {
    return <ResultScreen session={session} onRetry={(qs) => start(qs, 'תרגול טעויות', true)} onHome={() => setSession(null)} />;
  }
  return (
    <Home
      history={history}
      onStart={(count, topic) => start(pickQuestions(count, topic), topic === 'all' ? 'כללי' : topic)}
      onClear={() => {
        clearHistory();
        setHistory([]);
      }}
    />
  );
}

function Home(props: { history: HistoryEntry[]; onStart: (count: number, topic: Topic | 'all') => void; onClear: () => void }) {
  const [count, setCount] = useState(10);
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  return (
    <main>
      <h1>מבחן ידע כללי 📝</h1>
      <p className="muted">שאלות אמריקאיות ושאלות נכון/לא נכון, עם הסבר לכל תשובה.</p>
      <h2>נושא</h2>
      <div className="chips">
        {(['all', ...TOPICS] as const).map((t) => (
          <button key={t} className={'chip' + (topic === t ? ' on' : '')} onClick={() => setTopic(t)}>
            {t === 'all' ? 'הכול' : t}
          </button>
        ))}
      </div>
      <h2>מספר שאלות</h2>
      <div className="chips">
        {COUNTS.map((c) => (
          <button key={c} className={'chip' + (count === c ? ' on' : '')} onClick={() => setCount(c)}>
            {c}
          </button>
        ))}
      </div>
      <button className="primary" onClick={() => props.onStart(count, topic)}>
        התחלת מבחן
      </button>
      {props.history.length > 0 && (
        <section>
          <h2>היסטוריית ציונים</h2>
          <ul className="history">
            {props.history.map((h, i) => (
              <li key={i}>
                <span>
                  {new Date(h.date).toLocaleDateString('he-IL')} · {h.topic}
                </span>
                <b>
                  {scorePercent(h.correct, h.total)}% ({h.correct}/{h.total})
                </b>
              </li>
            ))}
          </ul>
          <button className="link" onClick={props.onClear}>
            ניקוי היסטוריה
          </button>
        </section>
      )}
    </main>
  );
}

function QuestionScreen({ session, onFinish }: { session: Session; onFinish: (a: Answer[]) => void }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const q = session.questions[idx]!;
  const chosen = answers[idx];
  const answered = chosen !== undefined;
  const last = idx === session.questions.length - 1;

  const pick = (a: Answer) => {
    if (!answered) setAnswers((prev) => Object.assign([...prev], { [idx]: a }));
  };

  const options: { label: string; value: Answer }[] =
    q.type === 'choice' ? q.options.map((o, i) => ({ label: o, value: i })) : [{ label: 'נכון', value: true }, { label: 'לא נכון', value: false }];

  return (
    <main>
      <div className="progress" aria-label="התקדמות">
        <div style={{ width: `${((idx + (answered ? 1 : 0)) / session.questions.length) * 100}%` }} />
      </div>
      <p className="muted">
        שאלה {idx + 1} מתוך {session.questions.length} · {q.topic}
      </p>
      <h1>{q.text}</h1>
      <div className="options">
        {options.map((o) => {
          const cls = !answered ? '' : o.value === q.answer ? ' right' : o.value === chosen ? ' wrong' : '';
          return (
            <button key={String(o.value)} className={'option' + cls} disabled={answered} onClick={() => pick(o.value)}>
              {o.label}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={'feedback ' + (isCorrect(q, chosen!) ? 'ok' : 'bad')}>
          <b>{isCorrect(q, chosen!) ? 'נכון! ✅' : 'לא נכון ❌'}</b>
          <p>{q.explanation}</p>
          <button
            className="primary"
            onClick={() => (last ? onFinish(answers) : setIdx(idx + 1))}
          >
            {last ? 'לסיכום' : 'השאלה הבאה'}
          </button>
        </div>
      )}
    </main>
  );
}

function ResultScreen(props: { session: Session; onRetry: (qs: Question[]) => void; onHome: () => void }) {
  const { questions, answers } = props.session;
  const correct = questions.filter((q, i) => isCorrect(q, answers[i]!)).length;
  const pct = scorePercent(correct, questions.length);
  const wrong = wrongQuestions(questions, answers);
  return (
    <main>
      <h1>הציון הסופי</h1>
      <div className="score">{pct}</div>
      <p className="center">
        {correct} מתוך {questions.length} נכונות · {gradeMessage(pct)}
      </p>
      {wrong.length > 0 && (
        <>
          <h2>הטעויות שלך</h2>
          <ul className="mistakes">
            {wrong.map((q) => (
              <li key={q.id}>
                <b>{q.text}</b>
                <span>{q.explanation}</span>
              </li>
            ))}
          </ul>
          <button className="primary" onClick={() => props.onRetry(wrong)}>
            חזרה על הטעויות ({wrong.length})
          </button>
        </>
      )}
      <button className="secondary" onClick={props.onHome}>
        למסך הראשי
      </button>
    </main>
  );
}
