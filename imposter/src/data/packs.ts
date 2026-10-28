import type { Lang } from '../i18n';

export interface Pack {
  id: string;
  icon: string;
  name: Record<Lang, string>;
  words: Record<Lang, string[]>;
}

export const PACKS: Pack[] = [
  {
    id: 'animals',
    icon: 'animals',
    name: { en: 'Animals', he: 'חיות', ar: 'حيوانات', ru: 'Животные', es: 'Animales', fr: 'Animaux' },
    words: {
      en: ['Dog', 'Cat', 'Elephant', 'Giraffe', 'Lion', 'Dolphin', 'Penguin', 'Monkey', 'Snake', 'Owl', 'Crocodile', 'Horse', 'Cow', 'Sheep', 'Rabbit', 'Turtle', 'Bat', 'Shark', 'Parrot', 'Kangaroo'],
      he: ['כלב', 'חתול', 'פיל', 'ג׳ירפה', 'אריה', 'דולפין', 'פינגווין', 'קוף', 'נחש', 'ינשוף', 'תנין', 'סוס', 'פרה', 'כבשה', 'ארנב', 'צב', 'עטלף', 'כריש', 'תוכי', 'קנגורו'],
      ar: ['كلب', 'قطة', 'فيل', 'زرافة', 'أسد', 'دولفين', 'بطريق', 'قرد', 'ثعبان', 'بومة', 'تمساح', 'حصان', 'بقرة', 'خروف', 'أرنب', 'سلحفاة', 'خفاش', 'قرش', 'ببغاء', 'كنغر'],
      ru: ['собака', 'кошка', 'слон', 'жираф', 'лев', 'дельфин', 'пингвин', 'обезьяна', 'змея', 'сова', 'крокодил', 'лошадь', 'корова', 'овца', 'кролик', 'черепаха', 'летучая мышь', 'акула', 'попугай', 'кенгуру'],
      es: ['perro', 'gato', 'elefante', 'jirafa', 'león', 'delfín', 'pingüino', 'mono', 'serpiente', 'búho', 'cocodrilo', 'caballo', 'vaca', 'oveja', 'conejo', 'tortuga', 'murciélago', 'tiburón', 'loro', 'canguro'],
      fr: ['chien', 'chat', 'éléphant', 'girafe', 'lion', 'dauphin', 'manchot', 'singe', 'serpent', 'hibou', 'crocodile', 'cheval', 'vache', 'mouton', 'lapin', 'tortue', 'chauve-souris', 'requin', 'perroquet', 'kangourou'],
    },
  },
  {
    id: 'food',
    icon: 'food',
    name: { en: 'Food', he: 'אוכל', ar: 'طعام', ru: 'Еда', es: 'Comida', fr: 'Cuisine' },
    words: {
      en: ['Pizza', 'Burger', 'Sushi', 'Tacos', 'Falafel', 'Hummus', 'Schnitzel', 'Pasta', 'Salad', 'Ice cream', 'Chocolate', 'Pancakes', 'Pretzel', 'Soup', 'Steak', 'Popcorn', 'Bread', 'Sandwich', 'Fries', 'Omelette'],
      he: ['פיצה', 'המבורגר', 'סושי', 'שווארמה', 'פלאפל', 'חומוס', 'שניצל', 'פסטה', 'סלט', 'גלידה', 'שוקולד', 'פנקייק', 'בורקס', 'מרק', 'סטייק', 'טאקו', 'פופקורן', 'לחם', 'ג׳חנון', 'שקשוקה'],
      ar: ['بيتزا', 'برغر', 'سوشي', 'شاورما', 'فلافل', 'حمص', 'شنيتزل', 'معكرونة', 'سلطة', 'بوظة', 'شوكولاتة', 'فطيرة', 'كبة', 'شوربة', 'ستيك', 'تاكو', 'فشار', 'خبز', 'مناقيش', 'كباب'],
      ru: ['пицца', 'бургер', 'суши', 'шаурма', 'фалафель', 'хумус', 'шницель', 'паста', 'салат', 'мороженое', 'шоколад', 'блины', 'пельмени', 'суп', 'стейк', 'тако', 'попкорн', 'хлеб', 'борщ', 'омлет'],
      es: ['pizza', 'hamburguesa', 'sushi', 'tacos', 'falafel', 'hummus', 'croquetas', 'pasta', 'ensalada', 'helado', 'chocolate', 'tortilla', 'paella', 'sopa', 'filete', 'palomitas', 'pan', 'churros', 'empanada', 'gazpacho'],
      fr: ['pizza', 'hamburger', 'sushi', 'tacos', 'falafel', 'houmous', 'croissant', 'pâtes', 'salade', 'glace', 'chocolat', 'crêpe', 'fondue', 'soupe', 'steak', 'pop-corn', 'baguette', 'quiche', 'ratatouille', 'omelette'],
    },
  },
  {
    id: 'places',
    icon: 'places',
    name: { en: 'Places', he: 'מקומות', ar: 'أماكن', ru: 'Места', es: 'Lugares', fr: 'Lieux' },
    words: {
      en: ['Beach', 'Hospital', 'Airport', 'Mall', 'School', 'Library', 'Cinema', 'Restaurant', 'Zoo', 'Museum', 'Train station', 'Stadium', 'Desert', 'Forest', 'Volcano', 'Swimming pool', 'Bank', 'Gym', 'Hotel', 'Market'],
      he: ['חוף הים', 'בית חולים', 'שדה תעופה', 'קניון', 'בית ספר', 'ספרייה', 'קולנוע', 'מסעדה', 'גן חיות', 'מוזיאון', 'תחנת רכבת', 'אצטדיון', 'מדבר', 'יער', 'הר געש', 'בריכה', 'בנק', 'מכון כושר', 'מלון', 'שוק'],
      ar: ['شاطئ', 'مستشفى', 'مطار', 'مول', 'مدرسة', 'مكتبة', 'سينما', 'مطعم', 'حديقة حيوان', 'متحف', 'محطة قطار', 'ملعب', 'صحراء', 'غابة', 'بركان', 'مسبح', 'بنك', 'نادي رياضي', 'فندق', 'سوق'],
      ru: ['пляж', 'больница', 'аэропорт', 'торговый центр', 'школа', 'библиотека', 'кинотеатр', 'ресторан', 'зоопарк', 'музей', 'вокзал', 'стадион', 'пустыня', 'лес', 'вулкан', 'бассейн', 'банк', 'спортзал', 'отель', 'рынок'],
      es: ['playa', 'hospital', 'aeropuerto', 'centro comercial', 'escuela', 'biblioteca', 'cine', 'restaurante', 'zoológico', 'museo', 'estación de tren', 'estadio', 'desierto', 'bosque', 'volcán', 'piscina', 'banco', 'gimnasio', 'hotel', 'mercado'],
      fr: ['plage', 'hôpital', 'aéroport', 'centre commercial', 'école', 'bibliothèque', 'cinéma', 'restaurant', 'zoo', 'musée', 'gare', 'stade', 'désert', 'forêt', 'volcan', 'piscine', 'banque', 'salle de sport', 'hôtel', 'marché'],
    },
  },
  {
    id: 'jobs',
    icon: 'jobs',
    name: { en: 'Jobs', he: 'מקצועות', ar: 'مهن', ru: 'Профессии', es: 'Profesiones', fr: 'Métiers' },
    words: {
      en: ['Doctor', 'Teacher', 'Pilot', 'Police officer', 'Firefighter', 'Chef', 'Taxi driver', 'Engineer', 'Lawyer', 'Photographer', 'Singer', 'Actor', 'Farmer', 'Barber', 'Programmer', 'Astronaut', 'Baker', 'Plumber', 'Painter', 'Lifeguard'],
      he: ['רופא', 'מורה', 'טייס', 'שוטר', 'כבאי', 'טבח', 'נהג מונית', 'מהנדס', 'עורך דין', 'צלם', 'זמר', 'שחקן', 'חקלאי', 'ספר', 'מתכנת', 'אסטרונאוט', 'קונדיטור', 'שרברב', 'צייר', 'מציל'],
      ar: ['طبيب', 'معلم', 'طيار', 'شرطي', 'رجل إطفاء', 'طباخ', 'سائق تاكسي', 'مهندس', 'محامي', 'مصور', 'مغني', 'ممثل', 'مزارع', 'حلاق', 'مبرمج', 'رائد فضاء', 'خباز', 'سباك', 'رسام', 'منقذ'],
      ru: ['врач', 'учитель', 'пилот', 'полицейский', 'пожарный', 'повар', 'таксист', 'инженер', 'юрист', 'фотограф', 'певец', 'актёр', 'фермер', 'парикмахер', 'программист', 'космонавт', 'пекарь', 'сантехник', 'художник', 'спасатель'],
      es: ['médico', 'maestro', 'piloto', 'policía', 'bombero', 'cocinero', 'taxista', 'ingeniero', 'abogado', 'fotógrafo', 'cantante', 'actor', 'granjero', 'peluquero', 'programador', 'astronauta', 'panadero', 'fontanero', 'pintor', 'socorrista'],
      fr: ['médecin', 'professeur', 'pilote', 'policier', 'pompier', 'cuisinier', 'chauffeur de taxi', 'ingénieur', 'avocat', 'photographe', 'chanteur', 'acteur', 'agriculteur', 'coiffeur', 'programmeur', 'astronaute', 'boulanger', 'plombier', 'peintre', 'sauveteur'],
    },
  },
  {
    id: 'objects',
    icon: 'objects',
    name: { en: 'Objects', he: 'חפצים', ar: 'أغراض', ru: 'Предметы', es: 'Objetos', fr: 'Objets' },
    words: {
      en: ['Umbrella', 'Key', 'Phone', 'Glasses', 'Suitcase', 'Clock', 'Chair', 'Mirror', 'Camera', 'Candle', 'Scissors', 'Ball', 'Battery', 'Headphones', 'Toothbrush', 'Laptop', 'Lock', 'Balloon', 'Flashlight', 'Blanket'],
      he: ['מטריה', 'מפתח', 'טלפון', 'משקפיים', 'מזוודה', 'שעון', 'כיסא', 'מראה', 'מצלמה', 'נר', 'מספריים', 'כדור', 'סוללה', 'אוזניות', 'מברשת שיניים', 'מחשב נייד', 'מנעול', 'בלון', 'פנס', 'שמיכה'],
      ar: ['مظلة', 'مفتاح', 'هاتف', 'نظارات', 'حقيبة سفر', 'ساعة', 'كرسي', 'مرآة', 'كاميرا', 'شمعة', 'مقص', 'كرة', 'بطارية', 'سماعات', 'فرشاة أسنان', 'حاسوب محمول', 'قفل', 'بالون', 'مصباح يدوي', 'بطانية'],
      ru: ['зонт', 'ключ', 'телефон', 'очки', 'чемодан', 'часы', 'стул', 'зеркало', 'фотоаппарат', 'свеча', 'ножницы', 'мяч', 'батарейка', 'наушники', 'зубная щётка', 'ноутбук', 'замок', 'воздушный шар', 'фонарик', 'одеяло'],
      es: ['paraguas', 'llave', 'teléfono', 'gafas', 'maleta', 'reloj', 'silla', 'espejo', 'cámara', 'vela', 'tijeras', 'pelota', 'pila', 'auriculares', 'cepillo de dientes', 'portátil', 'candado', 'globo', 'linterna', 'manta'],
      fr: ['parapluie', 'clé', 'téléphone', 'lunettes', 'valise', 'montre', 'chaise', 'miroir', 'appareil photo', 'bougie', 'ciseaux', 'ballon', 'pile', 'écouteurs', 'brosse à dents', 'ordinateur portable', 'cadenas', 'ballon de baudruche', 'lampe de poche', 'couverture'],
    },
  },
  {
    id: 'sports',
    icon: 'sports',
    name: { en: 'Sports', he: 'ספורט', ar: 'رياضة', ru: 'Спорт', es: 'Deportes', fr: 'Sports' },
    words: {
      en: ['Soccer', 'Basketball', 'Tennis', 'Swimming', 'Judo', 'Cycling', 'Running', 'Surfing', 'Skiing', 'Boxing', 'Volleyball', 'Gymnastics', 'Golf', 'Ping pong', 'Pole vault', 'Chess', 'Climbing', 'Hockey', 'Snorkeling', 'Karate'],
      he: ['כדורגל', 'כדורסל', 'טניס', 'שחייה', 'ג׳ודו', 'רכיבה על אופניים', 'ריצה', 'גלישה', 'סקי', 'אגרוף', 'כדורעף', 'התעמלות', 'גולף', 'פינג פונג', 'קפיצה במוט', 'שחמט', 'טיפוס', 'הוקי', 'שנורקלינג', 'קראטה'],
      ar: ['كرة القدم', 'كرة السلة', 'تنس', 'سباحة', 'جودو', 'ركوب الدراجات', 'جري', 'ركوب الأمواج', 'تزلج', 'ملاكمة', 'كرة طائرة', 'جمباز', 'غولف', 'تنس الطاولة', 'قفز بالزانة', 'شطرنج', 'تسلق', 'هوكي', 'غوص', 'كاراتيه'],
      ru: ['футбол', 'баскетбол', 'теннис', 'плавание', 'дзюдо', 'велоспорт', 'бег', 'сёрфинг', 'лыжи', 'бокс', 'волейбол', 'гимнастика', 'гольф', 'настольный теннис', 'прыжки с шестом', 'шахматы', 'скалолазание', 'хоккей', 'дайвинг', 'карате'],
      es: ['fútbol', 'baloncesto', 'tenis', 'natación', 'judo', 'ciclismo', 'running', 'surf', 'esquí', 'boxeo', 'voleibol', 'gimnasia', 'golf', 'ping pong', 'salto con pértiga', 'ajedrez', 'escalada', 'hockey', 'buceo', 'kárate'],
      fr: ['football', 'basket', 'tennis', 'natation', 'judo', 'cyclisme', 'course à pied', 'surf', 'ski', 'boxe', 'volley', 'gymnastique', 'golf', 'ping-pong', 'saut à la perche', 'échecs', 'escalade', 'hockey', 'plongée', 'karaté'],
    },
  },
  {
    id: 'countries',
    icon: 'countries',
    name: { en: 'Countries', he: 'מדינות', ar: 'دول', ru: 'Страны', es: 'Países', fr: 'Pays' },
    words: {
      en: ['France', 'Japan', 'Brazil', 'Egypt', 'Italy', 'Mexico', 'India', 'Canada', 'Greece', 'Spain', 'Germany', 'Australia', 'Turkey', 'Thailand', 'Argentina', 'Norway', 'Morocco', 'Peru', 'Kenya', 'Iceland'],
      he: ['צרפת', 'יפן', 'ברזיל', 'מצרים', 'איטליה', 'מקסיקו', 'הודו', 'קנדה', 'יוון', 'ספרד', 'גרמניה', 'אוסטרליה', 'טורקיה', 'תאילנד', 'ארגנטינה', 'נורווגיה', 'מרוקו', 'פרו', 'קניה', 'איסלנד'],
      ar: ['فرنسا', 'اليابان', 'البرازيل', 'مصر', 'إيطاليا', 'المكسيك', 'الهند', 'كندا', 'اليونان', 'إسبانيا', 'ألمانيا', 'أستراليا', 'تركيا', 'تايلاند', 'الأرجنتين', 'النرويج', 'المغرب', 'بيرو', 'كينيا', 'آيسلندا'],
      ru: ['Франция', 'Япония', 'Бразилия', 'Египет', 'Италия', 'Мексика', 'Индия', 'Канада', 'Греция', 'Испания', 'Германия', 'Австралия', 'Турция', 'Таиланд', 'Аргентина', 'Норвегия', 'Марокко', 'Перу', 'Кения', 'Исландия'],
      es: ['Francia', 'Japón', 'Brasil', 'Egipto', 'Italia', 'México', 'India', 'Canadá', 'Grecia', 'España', 'Alemania', 'Australia', 'Turquía', 'Tailandia', 'Argentina', 'Noruega', 'Marruecos', 'Perú', 'Kenia', 'Islandia'],
      fr: ['France', 'Japon', 'Brésil', 'Égypte', 'Italie', 'Mexique', 'Inde', 'Canada', 'Grèce', 'Espagne', 'Allemagne', 'Australie', 'Turquie', 'Thaïlande', 'Argentine', 'Norvège', 'Maroc', 'Pérou', 'Kenya', 'Islande'],
    },
  },
  {
    id: 'movies',
    icon: 'movies',
    name: { en: 'Movies', he: 'סרטים', ar: 'أفلام', ru: 'Фильмы', es: 'Películas', fr: 'Films' },
    words: {
      en: ['Titanic', 'Jaws', 'Shrek', 'Frozen', 'Inception', 'Avatar', 'Matrix', 'Gladiator', 'Joker', 'Rocky', 'Alien', 'Psycho', 'Casablanca', 'Up', 'Coco', 'Bambi', 'Skyfall', 'Grease', 'Zorro', 'Dune'],
      he: ['טיטניק', 'מלתעות', 'שרק', 'לשחרר', 'התחלה', 'אווטאר', 'מטריקס', 'גלדיאטור', 'ג׳וקר', 'רוקי', 'החייזר', 'פסיכו', 'קזבלנקה', 'למעלה', 'קוקו', 'במבי', 'סקייפול', 'גריז', 'זורו', 'חולית'],
      ar: ['تايتانيك', 'الفك المفترس', 'شريك', 'ملكة الثلج', 'بداية', 'أفاتار', 'ماتريكس', 'المصارع', 'الجوكر', 'روكي', 'الغريب', 'سايكو', 'كازابلانكا', 'أب', 'كوكو', 'بامبي', 'سكاي فول', 'غريس', 'زورو', 'كثيب'],
      ru: ['Титаник', 'Челюсти', 'Шрек', 'Холодное сердце', 'Начало', 'Аватар', 'Матрица', 'Гладиатор', 'Джокер', 'Рокки', 'Чужой', 'Психо', 'Касабланка', 'Вверх', 'Тайна Коко', 'Бемби', 'Скайфолл', 'Бриолин', 'Зорро', 'Дюна'],
      es: ['Titanic', 'Tiburón', 'Shrek', 'Frozen', 'Origen', 'Avatar', 'Matrix', 'Gladiador', 'Joker', 'Rocky', 'Alien', 'Psicosis', 'Casablanca', 'Up', 'Coco', 'Bambi', 'Skyfall', 'Grease', 'Zorro', 'Dune'],
      fr: ['Titanic', 'Les Dents de la mer', 'Shrek', 'La Reine des neiges', 'Inception', 'Avatar', 'Matrix', 'Gladiator', 'Joker', 'Rocky', 'Alien', 'Psychose', 'Casablanca', 'Là-haut', 'Coco', 'Bambi', 'Skyfall', 'Grease', 'Zorro', 'Dune'],
    },
  },
  {
    id: 'music',
    icon: 'music',
    name: { en: 'Music', he: 'מוזיקה', ar: 'موسيقى', ru: 'Музыка', es: 'Música', fr: 'Musique' },
    words: {
      en: ['Guitar', 'Piano', 'Drums', 'Violin', 'Concert', 'Microphone', 'Opera', 'Jazz', 'Rap', 'Choir', 'Saxophone', 'Trumpet', 'Festival', 'DJ', 'Orchestra', 'Lyrics', 'Headphones', 'Vinyl', 'Harmonica', 'Karaoke'],
      he: ['גיטרה', 'פסנתר', 'תופים', 'כינור', 'הופעה', 'מיקרופון', 'אופרה', 'ג׳אז', 'ראפ', 'מקהלה', 'סקסופון', 'חצוצרה', 'פסטיבל', 'תקליטן', 'תזמורת', 'מילים', 'אוזניות', 'תקליט', 'מפוחית', 'קריוקי'],
      ar: ['غيتار', 'بيانو', 'طبول', 'كمان', 'حفلة موسيقية', 'ميكروفون', 'أوبرا', 'جاز', 'راب', 'جوقة', 'ساكسفون', 'بوق', 'مهرجان', 'دي جي', 'أوركسترا', 'كلمات', 'سماعات', 'أسطوانة', 'هارمونيكا', 'كاريوكي'],
      ru: ['гитара', 'пианино', 'барабаны', 'скрипка', 'концерт', 'микрофон', 'опера', 'джаз', 'рэп', 'хор', 'саксофон', 'труба', 'фестиваль', 'диджей', 'оркестр', 'текст песни', 'наушники', 'виниловая пластинка', 'губная гармошка', 'караоке'],
      es: ['guitarra', 'piano', 'batería', 'violín', 'concierto', 'micrófono', 'ópera', 'jazz', 'rap', 'coro', 'saxofón', 'trompeta', 'festival', 'DJ', 'orquesta', 'letra', 'auriculares', 'vinilo', 'armónica', 'karaoke'],
      fr: ['guitare', 'piano', 'batterie', 'violon', 'concert', 'micro', 'opéra', 'jazz', 'rap', 'chorale', 'saxophone', 'trompette', 'festival', 'DJ', 'orchestre', 'paroles', 'casque', 'vinyle', 'harmonica', 'karaoké'],
    },
  },
  {
    id: 'tech',
    icon: 'tech',
    name: { en: 'Tech', he: 'טכנולוגיה', ar: 'تقنية', ru: 'Технологии', es: 'Tecnología', fr: 'Technologie' },
    words: {
      en: ['Robot', 'Satellite', 'Drone', 'Password', 'Wi-Fi', 'Server', 'Keyboard', 'Charger', 'Bluetooth', 'Hacker', 'Algorithm', 'Browser', 'Camera', 'Database', 'Router', 'Hologram', 'Battery', 'Cloud', 'Firewall', 'Emoji'],
      he: ['רובוט', 'לוויין', 'רחפן', 'סיסמה', 'וויי פיי', 'שרת', 'מקלדת', 'מטען', 'בלוטות׳', 'האקר', 'אלגוריתם', 'דפדפן', 'מצלמה', 'מסד נתונים', 'נתב', 'הולוגרמה', 'סוללה', 'ענן', 'חומת אש', 'אמוג׳י'],
      ar: ['روبوت', 'قمر صناعي', 'طائرة مسيّرة', 'كلمة مرور', 'واي فاي', 'خادم', 'لوحة مفاتيح', 'شاحن', 'بلوتوث', 'هاكر', 'خوارزمية', 'متصفح', 'كاميرا', 'قاعدة بيانات', 'راوتر', 'هولوغرام', 'بطارية', 'سحابة', 'جدار حماية', 'إيموجي'],
      ru: ['робот', 'спутник', 'дрон', 'пароль', 'вай-фай', 'сервер', 'клавиатура', 'зарядка', 'блютус', 'хакер', 'алгоритм', 'браузер', 'камера', 'база данных', 'роутер', 'голограмма', 'аккумулятор', 'облако', 'брандмауэр', 'эмодзи'],
      es: ['robot', 'satélite', 'dron', 'contraseña', 'wifi', 'servidor', 'teclado', 'cargador', 'bluetooth', 'hacker', 'algoritmo', 'navegador', 'cámara', 'base de datos', 'router', 'holograma', 'batería', 'nube', 'cortafuegos', 'emoji'],
      fr: ['robot', 'satellite', 'drone', 'mot de passe', 'wifi', 'serveur', 'clavier', 'chargeur', 'bluetooth', 'pirate', 'algorithme', 'navigateur', 'caméra', 'base de données', 'routeur', 'hologramme', 'batterie', 'nuage', 'pare-feu', 'émoji'],
    },
  },
];
