import type { Lang } from '../i18n';

export interface Pack {
  id: string;
  emoji: string;
  name: Record<Lang, string>;
  words: Record<Lang, string[]>;
}

export const PACKS: Pack[] = [
  {
    id: 'animals',
    emoji: '🐕',
    name: { en: 'Animals', he: 'חיות' },
    words: {
      en: ['Dog', 'Cat', 'Elephant', 'Giraffe', 'Lion', 'Dolphin', 'Penguin', 'Monkey', 'Snake', 'Owl', 'Crocodile', 'Horse', 'Cow', 'Sheep', 'Rabbit', 'Turtle', 'Bat', 'Shark', 'Parrot', 'Kangaroo'],
      he: ['כלב', 'חתול', 'פיל', 'ג׳ירפה', 'אריה', 'דולפין', 'פינגווין', 'קוף', 'נחש', 'ינשוף', 'תנין', 'סוס', 'פרה', 'כבשה', 'ארנב', 'צב', 'עטלף', 'כריש', 'תוכי', 'קנגורו'],
    },
  },
  {
    id: 'food',
    emoji: '🍔',
    name: { en: 'Food', he: 'אוכל' },
    words: {
      en: ['Pizza', 'Burger', 'Sushi', 'Tacos', 'Falafel', 'Hummus', 'Schnitzel', 'Pasta', 'Salad', 'Ice cream', 'Chocolate', 'Pancakes', 'Pretzel', 'Soup', 'Steak', 'Popcorn', 'Bread', 'Sandwich', 'Fries', 'Omelette'],
      he: ['פיצה', 'המבורגר', 'סושי', 'שווארמה', 'פלאפל', 'חומוס', 'שניצל', 'פסטה', 'סלט', 'גלידה', 'שוקולד', 'פנקייק', 'בורקס', 'מרק', 'סטייק', 'טאקו', 'פופקורן', 'לחם', 'ג׳חנון', 'שקשוקה'],
    },
  },
  {
    id: 'places',
    emoji: '🏙️',
    name: { en: 'Places', he: 'מקומות' },
    words: {
      en: ['Beach', 'Hospital', 'Airport', 'Mall', 'School', 'Library', 'Cinema', 'Restaurant', 'Zoo', 'Museum', 'Train station', 'Stadium', 'Desert', 'Forest', 'Volcano', 'Swimming pool', 'Bank', 'Gym', 'Hotel', 'Market'],
      he: ['חוף הים', 'בית חולים', 'שדה תעופה', 'קניון', 'בית ספר', 'ספרייה', 'קולנוע', 'מסעדה', 'גן חיות', 'מוזיאון', 'תחנת רכבת', 'אצטדיון', 'מדבר', 'יער', 'הר געש', 'בריכה', 'בנק', 'מכון כושר', 'מלון', 'שוק'],
    },
  },
  {
    id: 'jobs',
    emoji: '💼',
    name: { en: 'Jobs', he: 'מקצועות' },
    words: {
      en: ['Doctor', 'Teacher', 'Pilot', 'Police officer', 'Firefighter', 'Chef', 'Taxi driver', 'Engineer', 'Lawyer', 'Photographer', 'Singer', 'Actor', 'Farmer', 'Barber', 'Programmer', 'Astronaut', 'Baker', 'Plumber', 'Painter', 'Lifeguard'],
      he: ['רופא', 'מורה', 'טייס', 'שוטר', 'כבאי', 'טבח', 'נהג מונית', 'מהנדס', 'עורך דין', 'צלם', 'זמר', 'שחקן', 'חקלאי', 'ספר', 'מתכנת', 'אסטרונאוט', 'קונדיטור', 'שרברב', 'צייר', 'מציל'],
    },
  },
  {
    id: 'objects',
    emoji: '📓',
    name: { en: 'Objects', he: 'חפצים' },
    words: {
      en: ['Umbrella', 'Key', 'Phone', 'Glasses', 'Suitcase', 'Clock', 'Chair', 'Mirror', 'Camera', 'Candle', 'Scissors', 'Ball', 'Battery', 'Headphones', 'Toothbrush', 'Laptop', 'Lock', 'Balloon', 'Flashlight', 'Blanket'],
      he: ['מטריה', 'מפתח', 'טלפון', 'משקפיים', 'מזוודה', 'שעון', 'כיסא', 'מראה', 'מצלמה', 'נר', 'מספריים', 'כדור', 'סוללה', 'אוזניות', 'מברשת שיניים', 'מחשב נייד', 'מנעול', 'בלון', 'פנס', 'שמיכה'],
    },
  },
  {
    id: 'sports',
    emoji: '⚽',
    name: { en: 'Sports', he: 'ספורט' },
    words: {
      en: ['Soccer', 'Basketball', 'Tennis', 'Swimming', 'Judo', 'Cycling', 'Running', 'Surfing', 'Skiing', 'Boxing', 'Volleyball', 'Gymnastics', 'Golf', 'Ping pong', 'Pole vault', 'Chess', 'Climbing', 'Hockey', 'Snorkeling', 'Karate'],
      he: ['כדורגל', 'כדורסל', 'טניס', 'שחייה', 'ג׳ודו', 'רכיבה על אופניים', 'ריצה', 'גלישה', 'סקי', 'אגרוף', 'כדורעף', 'התעמלות', 'גולף', 'פינג פונג', 'קפיצה במוט', 'שחמט', 'טיפוס', 'הוקי', 'שנורקלינג', 'קראטה'],
    },
  },
];
