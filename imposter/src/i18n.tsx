import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Role } from './engine/game';

export type Lang = 'en' | 'he' | 'ar' | 'ru' | 'es' | 'fr';

export const LANG_OPTIONS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'he', label: 'עברית' },
  { id: 'ar', label: 'العربية' },
  { id: 'ru', label: 'Русский' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
];

const RTL: Lang[] = ['he', 'ar'];

export interface Strings {
  question: (a: number, b: number) => string;
  player: (n: number) => string;
  howMany: string;
  howManySub: (min: number, max: number) => string;
  nameQ: (n: number) => string;
  nameAria: (n: number) => string;
  packsQ: string;
  packsSub: string;
  packsMin: (min: number, have: number) => string;
  words: (n: number) => string;
  modeQ: string;
  classic: string;
  classicDesc: string;
  roles: string;
  rolesDesc: string;
  rolesNeed: (n: number) => string;
  impQ: string;
  impSub: (players: number, max: number) => string;
  back: string;
  next: string;
  startGame: string;
  soundAria: string;
  roleInfo: Record<Role, { title: string; blurb: string }>;
  eyebrow: string;
  yourClient: string;
  yourTarget: string;
  secretWord: string;
  holdReveal: string;
  releaseHide: string;
  nextPlayer: string;
  startPlaying: string;
  turn: (a: number, b: number) => string;
  roundLabel: (r: number) => string;
  anotherRound: string;
  givesClue: string;
  goVote: string;
  voteLocked: string;
  allSpoke: string;
  whoImposter: string;
  crewWins: string;
  imposterWins: string;
  jesterWins: string;
  tie: string;
  votedOut: (name: string) => string;
  wordWas: string;
  playAgain: string;
  backToSetup: string;
  arrow: string;
  o: OnlineStrings;
}

export interface OnlineStrings {
  howPlay: string;
  onePhone: string;
  onePhoneDesc: string;
  createRoom: string;
  createRoomDesc: string;
  joinRoom: string;
  joinRoomDesc: string;
  yourName: string;
  roomCode: string;
  create: string;
  join: string;
  connecting: string;
  errNet: string;
  errNotFound: string;
  errFull: string;
  errStarted: string;
  hostLeft: string;
  lobby: string;
  shareCode: string;
  copyLink: string;
  copied: string;
  waitingHost: string;
  needPlayers: (n: number) => string;
  you: string;
  host: string;
  ready: string;
  waitingOthers: (k: number, n: number) => string;
  waitingHostAction: string;
  voteSent: string;
  leave: string;
  left: string;
  speaking: string;
}

const en: Strings = {
  question: (a, b) => `Question ${a} of ${b}`,
  player: (n) => `Player ${n}`,
  howMany: 'How many players?',
  howManySub: (min, max) => `${min} to ${max} people on one phone.`,
  nameQ: (n) => `What's player ${n}'s name?`,
  nameAria: (n) => `Player ${n} name`,
  packsQ: 'What are you playing?',
  packsSub: 'Pick at least 3 categories.',
  packsMin: (min, have) => `${have} of ${min} chosen`,
  words: (n) => `${n} words`,
  modeQ: 'Pick a mode',
  classic: 'Classic',
  classicDesc: 'One or more imposters. Everyone else shares the secret word.',
  roles: 'Roles',
  rolesDesc: 'Adds a Jester, plus a Bounty Hunter at 5 players and a Bodyguard at 6.',
  rolesNeed: (n) => `Needs ${n}+ players.`,
  impQ: 'How many imposters?',
  impSub: (p, m) => `With ${p} players you can have up to ${m}.`,
  back: 'Back',
  next: 'Next',
  startGame: 'Start game',
  soundAria: 'Sound and vibration',
  roleInfo: {
    imposter: { title: 'Imposter', blurb: 'Blend in with the innocents and avoid suspicion.' },
    innocent: { title: 'Innocent', blurb: 'Work with the group to find and expose the imposters.' },
    jester: { title: 'Jester', blurb: 'Create chaos and misdirection. You win if the group votes you out.' },
    bodyguard: { title: 'Bodyguard', blurb: 'Secretly shield a fellow imposter-team player from suspicion.' },
    bounty: { title: 'Bounty Hunter', blurb: 'Target a specific imposter-team player and work to expose them.' },
  },
  eyebrow: 'Identity confirmed',
  yourClient: 'Your client',
  yourTarget: 'Your target',
  secretWord: 'Secret word',
  holdReveal: 'Press and hold to reveal',
  releaseHide: 'Release to hide',
  nextPlayer: 'Next player',
  startPlaying: 'Start playing',
  turn: (a, b) => `Turn ${a} of ${b}`,
  roundLabel: (r) => `Round ${r}`,
  anotherRound: 'Another round',
  givesClue: 'Gives a one-word clue.',
  goVote: 'Go to vote',
  voteLocked: 'Vote (after everyone speaks)',
  allSpoke: 'Everyone has spoken. You can vote now.',
  whoImposter: 'Who do you think is the imposter?',
  crewWins: 'The crew wins! 🎉',
  imposterWins: 'The imposter wins! 😈',
  jesterWins: 'The jester wins! 🃏',
  tie: 'The vote was tied, so nobody was caught.',
  votedOut: (n) => `The group voted out ${n}.`,
  wordWas: 'The word was',
  playAgain: 'Play again',
  backToSetup: 'Back to setup',
  arrow: '→',
  o: {
    howPlay: 'How do you want to play?',
    onePhone: 'One phone',
    onePhoneDesc: 'Pass the phone around the group.',
    createRoom: 'Create a room',
    createRoomDesc: 'Everyone plays on their own phone. You get a room code.',
    joinRoom: 'Join a room',
    joinRoomDesc: 'Enter the code from your host.',
    yourName: 'Your name',
    roomCode: 'Room code',
    create: 'Create room',
    join: 'Join',
    connecting: 'Connecting…',
    errNet: 'Could not connect. Check your internet and try again.',
    errNotFound: 'No room with that code. Check it and try again.',
    errFull: 'That room is full.',
    errStarted: 'That game has already started.',
    hostLeft: 'The host left the room.',
    lobby: 'Lobby',
    shareCode: 'Share this code with your friends',
    copyLink: 'Copy invite link',
    copied: 'Copied!',
    waitingHost: 'Waiting for the host to start…',
    needPlayers: (n) => `Need ${n} more to start`,
    you: 'you',
    host: 'host',
    ready: 'I saw my card',
    waitingOthers: (k, n) => `Waiting for others (${k}/${n})`,
    waitingHostAction: 'Waiting for the host…',
    voteSent: 'Vote sent. Waiting for the others…',
    leave: 'Leave room',
    left: 'left',
    speaking: 'is giving a clue',
  },
};

const he: Strings = {
  question: (a, b) => `שאלה ${a} מתוך ${b}`,
  player: (n) => `שחקן ${n}`,
  howMany: 'כמה שחקנים?',
  howManySub: (min, max) => `${min} עד ${max} אנשים על טלפון אחד.`,
  nameQ: (n) => `איך קוראים לשחקן ${n}\u200F?`,
  nameAria: (n) => `שם שחקן ${n}`,
  packsQ: 'על מה משחקים?',
  packsSub: 'בחרו לפחות 3 קטגוריות.',
  packsMin: (min, have) => `${have} מתוך ${min} נבחרו`,
  words: (n) => `${n} מילים`,
  modeQ: 'בחרו מצב',
  classic: 'קלאסי',
  classicDesc: 'מתחזה אחד או יותר. כל השאר מכירים את המילה הסודית.',
  roles: 'תפקידים',
  rolesDesc: 'מוסיף ליצן, וציד ראשים מ-5 שחקנים ושומר ראש מ-6.',
  rolesNeed: (n) => `צריך ${n}+ שחקנים.`,
  impQ: 'כמה מתחזים?',
  impSub: (p, m) => `עם ${p} שחקנים אפשר עד ${m}.`,
  back: 'חזרה',
  next: 'הבא',
  startGame: 'התחל משחק',
  soundAria: 'צלילים ורטט',
  roleInfo: {
    imposter: { title: 'מתחזה', blurb: 'התערבבו בין החפים מפשע ואל תיתפסו.' },
    innocent: { title: 'חף מפשע', blurb: 'עבדו עם הקבוצה כדי לחשוף את המתחזים.' },
    jester: { title: 'ליצן', blurb: 'עשו בלגן ובלבלו את כולם. מנצחים אם מצביעים נגדכם.' },
    bodyguard: { title: 'שומר ראש', blurb: 'הגנו בסתר על שחקן מקבוצת המתחזים מפני חשד.' },
    bounty: { title: 'ציד ראשים', blurb: 'המטרה שלכם שחקן ספציפי מקבוצת המתחזים. חשפו אותו.' },
  },
  eyebrow: 'הזהות אושרה',
  yourClient: 'הלקוח שלך',
  yourTarget: 'המטרה שלך',
  secretWord: 'המילה הסודית',
  holdReveal: 'החזק לחוץ כדי לחשוף',
  releaseHide: 'עזוב כדי להסתיר',
  nextPlayer: 'השחקן הבא',
  startPlaying: 'מתחילים לשחק',
  turn: (a, b) => `תור ${a} מתוך ${b}`,
  roundLabel: (r) => `סבב ${r}`,
  anotherRound: 'סבב נוסף',
  givesClue: 'אומר רמז של מילה אחת.',
  goVote: 'עוברים להצבעה',
  voteLocked: 'הצבעה (אחרי שכולם מדברים)',
  allSpoke: 'כולם דיברו. אפשר להצביע.',
  whoImposter: 'מי לדעתך המתחזה?',
  crewWins: 'הצוות ניצח! 🎉',
  imposterWins: 'המתחזה ניצח! 😈',
  jesterWins: 'הליצן ניצח! 🃏',
  tie: 'תיקו בהצבעה, אף אחד לא נתפס.',
  votedOut: (n) => `הקבוצה הצביעה נגד ${n}.`,
  wordWas: 'המילה הייתה',
  playAgain: 'סיבוב נוסף',
  backToSetup: 'חזרה להגדרות',
  arrow: '←',
  o: {
    howPlay: 'איך רוצים לשחק?',
    onePhone: 'טלפון אחד',
    onePhoneDesc: 'מעבירים את הטלפון בין כולם.',
    createRoom: 'יצירת חדר',
    createRoomDesc: 'כל אחד משחק בטלפון שלו. מקבלים קוד חדר.',
    joinRoom: 'הצטרפות לחדר',
    joinRoomDesc: 'מקלידים את הקוד של המארח.',
    yourName: 'השם שלך',
    roomCode: 'קוד חדר',
    create: 'צור חדר',
    join: 'הצטרף',
    connecting: 'מתחבר…',
    errNet: 'אי אפשר להתחבר. בדקו את האינטרנט ונסו שוב.',
    errNotFound: 'אין חדר עם הקוד הזה. בדקו ונסו שוב.',
    errFull: 'החדר מלא.',
    errStarted: 'המשחק כבר התחיל.',
    hostLeft: 'המארח עזב את החדר.',
    lobby: 'לובי',
    shareCode: 'שתפו את הקוד עם החברים',
    copyLink: 'העתק קישור הזמנה',
    copied: 'הועתק!',
    waitingHost: 'מחכים שהמארח יתחיל…',
    needPlayers: (n) => `חסרים עוד ${n} כדי להתחיל`,
    you: 'אתה',
    host: 'מארח',
    ready: 'ראיתי את הכרטיס',
    waitingOthers: (k, n) => `מחכים לשאר (${k}/${n})`,
    waitingHostAction: 'מחכים למארח…',
    voteSent: 'ההצבעה נשלחה. מחכים לשאר…',
    leave: 'עזוב חדר',
    left: 'עזב',
    speaking: 'נותן רמז',
  },
};

const ar: Strings = {
  question: (a, b) => `السؤال ${a} من ${b}`,
  player: (n) => `لاعب ${n}`,
  howMany: 'كم عدد اللاعبين؟',
  howManySub: (min, max) => `من ${min} إلى ${max} أشخاص على هاتف واحد.`,
  nameQ: (n) => `ما اسم اللاعب ${n}؟`,
  nameAria: (n) => `اسم اللاعب ${n}`,
  packsQ: 'ماذا ستلعبون؟',
  packsSub: 'اختاروا 3 فئات على الأقل.',
  packsMin: (min, have) => `تم اختيار ${have} من ${min}`,
  words: (n) => `${n} كلمة`,
  modeQ: 'اختاروا الوضع',
  classic: 'كلاسيكي',
  classicDesc: 'محتال واحد أو أكثر. الباقون يعرفون الكلمة السرية.',
  roles: 'الأدوار',
  rolesDesc: 'يضيف مهرجاً، وصائد جوائز عند 5 لاعبين وحارساً شخصياً عند 6.',
  rolesNeed: (n) => `يحتاج ${n}+ لاعبين.`,
  impQ: 'كم عدد المحتالين؟',
  impSub: (p, m) => `مع ${p} لاعبين يمكن حتى ${m}.`,
  back: 'رجوع',
  next: 'التالي',
  startGame: 'ابدأ اللعبة',
  soundAria: 'الصوت والاهتزاز',
  roleInfo: {
    imposter: { title: 'محتال', blurb: 'اندمج مع الأبرياء وتجنب الشبهات.' },
    innocent: { title: 'بريء', blurb: 'تعاون مع المجموعة لكشف المحتالين.' },
    jester: { title: 'مهرج', blurb: 'أثر الفوضى وشتت الجميع. تفوز إذا صوتوا ضدك.' },
    bodyguard: { title: 'حارس شخصي', blurb: 'احمِ سراً لاعباً من فريق المحتالين من الشبهات.' },
    bounty: { title: 'صائد جوائز', blurb: 'هدفك لاعب محدد من فريق المحتالين. اكشفه.' },
  },
  eyebrow: 'تم تأكيد الهوية',
  yourClient: 'عميلك',
  yourTarget: 'هدفك',
  secretWord: 'الكلمة السرية',
  holdReveal: 'اضغط مطولاً للكشف',
  releaseHide: 'ارفع إصبعك للإخفاء',
  nextPlayer: 'اللاعب التالي',
  startPlaying: 'ابدأوا اللعب',
  turn: (a, b) => `الدور ${a} من ${b}`,
  roundLabel: (r) => `الجولة ${r}`,
  anotherRound: 'جولة أخرى',
  givesClue: 'يعطي تلميحاً من كلمة واحدة.',
  goVote: 'انتقلوا للتصويت',
  voteLocked: 'التصويت (بعد أن يتكلم الجميع)',
  allSpoke: 'تكلم الجميع. يمكنكم التصويت الآن.',
  whoImposter: 'من برأيك المحتال؟',
  crewWins: 'فاز الفريق! 🎉',
  imposterWins: 'فاز المحتال! 😈',
  jesterWins: 'فاز المهرج! 🃏',
  tie: 'تعادل في التصويت، لم يُكشف أحد.',
  votedOut: (n) => `صوتت المجموعة ضد ${n}.`,
  wordWas: 'الكلمة كانت',
  playAgain: 'جولة جديدة',
  backToSetup: 'العودة للإعدادات',
  arrow: '←',
  o: {
    howPlay: 'كيف تريدون اللعب؟',
    onePhone: 'هاتف واحد',
    onePhoneDesc: 'مرروا الهاتف بين الجميع.',
    createRoom: 'إنشاء غرفة',
    createRoomDesc: 'كل واحد يلعب على هاتفه. تحصل على رمز الغرفة.',
    joinRoom: 'الانضمام إلى غرفة',
    joinRoomDesc: 'اكتب الرمز من المضيف.',
    yourName: 'اسمك',
    roomCode: 'رمز الغرفة',
    create: 'أنشئ الغرفة',
    join: 'انضم',
    connecting: 'جارٍ الاتصال…',
    errNet: 'تعذر الاتصال. تحقق من الإنترنت وحاول مجدداً.',
    errNotFound: 'لا توجد غرفة بهذا الرمز. تحقق وحاول مجدداً.',
    errFull: 'الغرفة ممتلئة.',
    errStarted: 'اللعبة بدأت بالفعل.',
    hostLeft: 'غادر المضيف الغرفة.',
    lobby: 'الردهة',
    shareCode: 'شاركوا هذا الرمز مع أصدقائكم',
    copyLink: 'انسخ رابط الدعوة',
    copied: 'تم النسخ!',
    waitingHost: 'بانتظار المضيف ليبدأ…',
    needPlayers: (n) => `يلزم ${n} آخرون للبدء`,
    you: 'أنت',
    host: 'المضيف',
    ready: 'رأيت بطاقتي',
    waitingOthers: (k, n) => `بانتظار الآخرين (${k}/${n})`,
    waitingHostAction: 'بانتظار المضيف…',
    voteSent: 'تم إرسال صوتك. بانتظار الآخرين…',
    leave: 'غادر الغرفة',
    left: 'غادر',
    speaking: 'يعطي تلميحاً',
  },
};

const ru: Strings = {
  question: (a, b) => `Вопрос ${a} из ${b}`,
  player: (n) => `Игрок ${n}`,
  howMany: 'Сколько игроков?',
  howManySub: (min, max) => `От ${min} до ${max} человек на одном телефоне.`,
  nameQ: (n) => `Как зовут игрока ${n}?`,
  nameAria: (n) => `Имя игрока ${n}`,
  packsQ: 'Во что играем?',
  packsSub: 'Выберите не меньше 3 категорий.',
  packsMin: (min, have) => `Выбрано ${have} из ${min}`,
  words: (n) => `слов: ${n}`,
  modeQ: 'Выберите режим',
  classic: 'Классика',
  classicDesc: 'Один или несколько самозванцев. Остальные знают секретное слово.',
  roles: 'Роли',
  rolesDesc: 'Добавляет Шута, а также Охотника за головами при 5 игроках и Телохранителя при 6.',
  rolesNeed: (n) => `Нужно ${n}+ игроков.`,
  impQ: 'Сколько самозванцев?',
  impSub: (p, m) => `При ${p} игроках можно до ${m}.`,
  back: 'Назад',
  next: 'Далее',
  startGame: 'Начать игру',
  soundAria: 'Звук и вибрация',
  roleInfo: {
    imposter: { title: 'Самозванец', blurb: 'Сливайтесь с невиновными и не вызывайте подозрений.' },
    innocent: { title: 'Невиновный', blurb: 'Помогите группе найти и разоблачить самозванцев.' },
    jester: { title: 'Шут', blurb: 'Создавайте хаос. Вы побеждаете, если за вас проголосуют.' },
    bodyguard: { title: 'Телохранитель', blurb: 'Тайно защищайте игрока из команды самозванцев.' },
    bounty: { title: 'Охотник за головами', blurb: 'Ваша цель конкретный игрок из команды самозванцев. Разоблачите его.' },
  },
  eyebrow: 'Личность подтверждена',
  yourClient: 'Ваш клиент',
  yourTarget: 'Ваша цель',
  secretWord: 'Секретное слово',
  holdReveal: 'Нажмите и держите',
  releaseHide: 'Отпустите, чтобы скрыть',
  nextPlayer: 'Следующий игрок',
  startPlaying: 'Начать игру',
  turn: (a, b) => `Ход ${a} из ${b}`,
  roundLabel: (r) => `Раунд ${r}`,
  anotherRound: 'Ещё раунд',
  givesClue: 'Даёт подсказку в одно слово.',
  goVote: 'Перейти к голосованию',
  voteLocked: 'Голосование (когда все скажут)',
  allSpoke: 'Все высказались. Можно голосовать.',
  whoImposter: 'Кто, по-вашему, самозванец?',
  crewWins: 'Команда победила! 🎉',
  imposterWins: 'Самозванец победил! 😈',
  jesterWins: 'Шут победил! 🃏',
  tie: 'Голоса разделились, никого не поймали.',
  votedOut: (n) => `Группа проголосовала против: ${n}.`,
  wordWas: 'Слово было',
  playAgain: 'Сыграть ещё',
  backToSetup: 'К настройкам',
  arrow: '→',
  o: {
    howPlay: 'Как будете играть?',
    onePhone: 'Один телефон',
    onePhoneDesc: 'Передаёте телефон по кругу.',
    createRoom: 'Создать комнату',
    createRoomDesc: 'Каждый играет на своём телефоне. Вы получите код комнаты.',
    joinRoom: 'Войти в комнату',
    joinRoomDesc: 'Введите код от ведущего.',
    yourName: 'Ваше имя',
    roomCode: 'Код комнаты',
    create: 'Создать',
    join: 'Войти',
    connecting: 'Подключение…',
    errNet: 'Не удалось подключиться. Проверьте интернет и попробуйте снова.',
    errNotFound: 'Комнаты с таким кодом нет. Проверьте код.',
    errFull: 'Комната заполнена.',
    errStarted: 'Игра уже началась.',
    hostLeft: 'Ведущий покинул комнату.',
    lobby: 'Лобби',
    shareCode: 'Отправьте этот код друзьям',
    copyLink: 'Скопировать ссылку',
    copied: 'Скопировано!',
    waitingHost: 'Ждём, пока ведущий начнёт…',
    needPlayers: (n) => `Нужно ещё ${n}, чтобы начать`,
    you: 'вы',
    host: 'ведущий',
    ready: 'Я посмотрел карточку',
    waitingOthers: (k, n) => `Ждём остальных (${k}/${n})`,
    waitingHostAction: 'Ждём ведущего…',
    voteSent: 'Голос отправлен. Ждём остальных…',
    leave: 'Выйти из комнаты',
    left: 'вышел',
    speaking: 'даёт подсказку',
  },
};

const es: Strings = {
  question: (a, b) => `Pregunta ${a} de ${b}`,
  player: (n) => `Jugador ${n}`,
  howMany: '¿Cuántos jugadores?',
  howManySub: (min, max) => `De ${min} a ${max} personas con un solo teléfono.`,
  nameQ: (n) => `¿Cómo se llama el jugador ${n}?`,
  nameAria: (n) => `Nombre del jugador ${n}`,
  packsQ: '¿A qué jugáis?',
  packsSub: 'Elige al menos 3 categorías.',
  packsMin: (min, have) => `${have} de ${min} elegidas`,
  words: (n) => `${n} palabras`,
  modeQ: 'Elige un modo',
  classic: 'Clásico',
  classicDesc: 'Uno o más impostores. El resto conoce la palabra secreta.',
  roles: 'Roles',
  rolesDesc: 'Añade un Bufón, un Cazarrecompensas con 5 jugadores y un Guardaespaldas con 6.',
  rolesNeed: (n) => `Necesita ${n}+ jugadores.`,
  impQ: '¿Cuántos impostores?',
  impSub: (p, m) => `Con ${p} jugadores puede haber hasta ${m}.`,
  back: 'Atrás',
  next: 'Siguiente',
  startGame: 'Empezar partida',
  soundAria: 'Sonido y vibración',
  roleInfo: {
    imposter: { title: 'Impostor', blurb: 'Mézclate con los inocentes y evita sospechas.' },
    innocent: { title: 'Inocente', blurb: 'Ayuda al grupo a encontrar y descubrir a los impostores.' },
    jester: { title: 'Bufón', blurb: 'Crea caos y confusión. Ganas si el grupo vota contra ti.' },
    bodyguard: { title: 'Guardaespaldas', blurb: 'Protege en secreto a un jugador del equipo impostor.' },
    bounty: { title: 'Cazarrecompensas', blurb: 'Tu objetivo es un jugador concreto del equipo impostor. Descúbrelo.' },
  },
  eyebrow: 'Identidad confirmada',
  yourClient: 'Tu cliente',
  yourTarget: 'Tu objetivo',
  secretWord: 'Palabra secreta',
  holdReveal: 'Mantén pulsado para ver',
  releaseHide: 'Suelta para ocultar',
  nextPlayer: 'Siguiente jugador',
  startPlaying: 'A jugar',
  turn: (a, b) => `Turno ${a} de ${b}`,
  roundLabel: (r) => `Ronda ${r}`,
  anotherRound: 'Otra ronda',
  givesClue: 'Da una pista de una palabra.',
  goVote: 'Ir a votar',
  voteLocked: 'Votar (cuando todos hablen)',
  allSpoke: 'Todos han hablado. Ya se puede votar.',
  whoImposter: '¿Quién crees que es el impostor?',
  crewWins: '¡Gana el equipo! 🎉',
  imposterWins: '¡Gana el impostor! 😈',
  jesterWins: '¡Gana el bufón! 🃏',
  tie: 'Empate en la votación, nadie fue descubierto.',
  votedOut: (n) => `El grupo votó contra ${n}.`,
  wordWas: 'La palabra era',
  playAgain: 'Jugar otra vez',
  backToSetup: 'Volver a ajustes',
  arrow: '→',
  o: {
    howPlay: '¿Cómo queréis jugar?',
    onePhone: 'Un teléfono',
    onePhoneDesc: 'Os pasáis el teléfono.',
    createRoom: 'Crear una sala',
    createRoomDesc: 'Cada uno juega en su teléfono. Recibes un código de sala.',
    joinRoom: 'Unirse a una sala',
    joinRoomDesc: 'Escribe el código del anfitrión.',
    yourName: 'Tu nombre',
    roomCode: 'Código de sala',
    create: 'Crear sala',
    join: 'Unirse',
    connecting: 'Conectando…',
    errNet: 'No se pudo conectar. Revisa tu internet e inténtalo de nuevo.',
    errNotFound: 'No hay ninguna sala con ese código. Revísalo.',
    errFull: 'La sala está llena.',
    errStarted: 'La partida ya empezó.',
    hostLeft: 'El anfitrión salió de la sala.',
    lobby: 'Sala de espera',
    shareCode: 'Comparte este código con tus amigos',
    copyLink: 'Copiar enlace de invitación',
    copied: '¡Copiado!',
    waitingHost: 'Esperando a que el anfitrión empiece…',
    needPlayers: (n) => `Faltan ${n} para empezar`,
    you: 'tú',
    host: 'anfitrión',
    ready: 'Ya vi mi carta',
    waitingOthers: (k, n) => `Esperando a los demás (${k}/${n})`,
    waitingHostAction: 'Esperando al anfitrión…',
    voteSent: 'Voto enviado. Esperando a los demás…',
    leave: 'Salir de la sala',
    left: 'salió',
    speaking: 'da una pista',
  },
};

const fr: Strings = {
  question: (a, b) => `Question ${a} sur ${b}`,
  player: (n) => `Joueur ${n}`,
  howMany: 'Combien de joueurs ?',
  howManySub: (min, max) => `De ${min} à ${max} personnes sur un seul téléphone.`,
  nameQ: (n) => `Comment s'appelle le joueur ${n} ?`,
  nameAria: (n) => `Nom du joueur ${n}`,
  packsQ: 'À quoi jouez-vous ?',
  packsSub: 'Choisissez au moins 3 catégories.',
  packsMin: (min, have) => `${have} sur ${min} choisies`,
  words: (n) => `${n} mots`,
  modeQ: 'Choisissez un mode',
  classic: 'Classique',
  classicDesc: 'Un ou plusieurs imposteurs. Les autres connaissent le mot secret.',
  roles: 'Rôles',
  rolesDesc: 'Ajoute un Bouffon, un Chasseur de primes à 5 joueurs et un Garde du corps à 6.',
  rolesNeed: (n) => `Il faut ${n}+ joueurs.`,
  impQ: 'Combien d\'imposteurs ?',
  impSub: (p, m) => `Avec ${p} joueurs, jusqu'à ${m}.`,
  back: 'Retour',
  next: 'Suivant',
  startGame: 'Lancer la partie',
  soundAria: 'Son et vibration',
  roleInfo: {
    imposter: { title: 'Imposteur', blurb: 'Fondez-vous parmi les innocents et évitez les soupçons.' },
    innocent: { title: 'Innocent', blurb: 'Aidez le groupe à démasquer les imposteurs.' },
    jester: { title: 'Bouffon', blurb: 'Semez le chaos. Vous gagnez si le groupe vote contre vous.' },
    bodyguard: { title: 'Garde du corps', blurb: "Protégez en secret un joueur de l'équipe des imposteurs." },
    bounty: { title: 'Chasseur de primes', blurb: "Votre cible est un joueur précis de l'équipe des imposteurs. Démasquez-le." },
  },
  eyebrow: 'Identité confirmée',
  yourClient: 'Votre client',
  yourTarget: 'Votre cible',
  secretWord: 'Mot secret',
  holdReveal: 'Maintenez pour révéler',
  releaseHide: 'Relâchez pour cacher',
  nextPlayer: 'Joueur suivant',
  startPlaying: 'Jouer',
  turn: (a, b) => `Tour ${a} sur ${b}`,
  roundLabel: (r) => `Manche ${r}`,
  anotherRound: 'Une autre manche',
  givesClue: 'Donne un indice d\'un seul mot.',
  goVote: 'Passer au vote',
  voteLocked: 'Voter (quand tout le monde a parlé)',
  allSpoke: 'Tout le monde a parlé. Vous pouvez voter.',
  whoImposter: 'Qui est l\'imposteur selon vous ?',
  crewWins: 'L\'équipe gagne ! 🎉',
  imposterWins: 'L\'imposteur gagne ! 😈',
  jesterWins: 'Le bouffon gagne ! 🃏',
  tie: 'Égalité au vote, personne n\'est démasqué.',
  votedOut: (n) => `Le groupe a voté contre ${n}.`,
  wordWas: 'Le mot était',
  playAgain: 'Rejouer',
  backToSetup: 'Retour aux réglages',
  arrow: '→',
  o: {
    howPlay: 'Comment voulez-vous jouer ?',
    onePhone: 'Un seul téléphone',
    onePhoneDesc: 'Faites circuler le téléphone.',
    createRoom: 'Créer un salon',
    createRoomDesc: 'Chacun joue sur son téléphone. Vous recevez un code de salon.',
    joinRoom: 'Rejoindre un salon',
    joinRoomDesc: 'Saisissez le code de l\'hôte.',
    yourName: 'Votre nom',
    roomCode: 'Code du salon',
    create: 'Créer le salon',
    join: 'Rejoindre',
    connecting: 'Connexion…',
    errNet: 'Connexion impossible. Vérifiez votre internet et réessayez.',
    errNotFound: 'Aucun salon avec ce code. Vérifiez-le.',
    errFull: 'Le salon est plein.',
    errStarted: 'La partie a déjà commencé.',
    hostLeft: 'L\'hôte a quitté le salon.',
    lobby: 'Salle d\'attente',
    shareCode: 'Partagez ce code avec vos amis',
    copyLink: 'Copier le lien d\'invitation',
    copied: 'Copié !',
    waitingHost: 'En attente du lancement par l\'hôte…',
    needPlayers: (n) => `Il manque ${n} joueur(s) pour commencer`,
    you: 'vous',
    host: 'hôte',
    ready: 'J\'ai vu ma carte',
    waitingOthers: (k, n) => `En attente des autres (${k}/${n})`,
    waitingHostAction: 'En attente de l\'hôte…',
    voteSent: 'Vote envoyé. En attente des autres…',
    leave: 'Quitter le salon',
    left: 'parti',
    speaking: 'donne un indice',
  },
};

const STRINGS: Record<Lang, Strings> = { en, he, ar, ru, es, fr };
const KEY = 'imposter.lang';

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
}

const LangContext = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: en });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return LANG_OPTIONS.some((l) => l.id === saved) ? (saved as Lang) : 'en';
    } catch {
      return 'en';
    }
  });
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL.includes(lang) ? 'rtl' : 'ltr';
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* storage unavailable */
    }
  };
  return <LangContext.Provider value={{ lang, setLang, t: STRINGS[lang] }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
