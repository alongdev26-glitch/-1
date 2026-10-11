export interface Pack {
  id: string;
  name: string;
  emoji: string;
  words: string[];
}

export const PACKS: Pack[] = [
  {
    id: 'animals',
    name: 'Animals',
    emoji: '🐶',
    words: ['Dog', 'Cat', 'Elephant', 'Giraffe', 'Lion', 'Dolphin', 'Penguin', 'Monkey', 'Snake', 'Owl', 'Crocodile', 'Horse', 'Cow', 'Sheep', 'Rabbit', 'Turtle', 'Bat', 'Shark', 'Parrot', 'Kangaroo'],
  },
  {
    id: 'food',
    name: 'Food',
    emoji: '🍣',
    words: ['Pizza', 'Burger', 'Sushi', 'Tacos', 'Falafel', 'Hummus', 'Schnitzel', 'Pasta', 'Salad', 'Ice cream', 'Chocolate', 'Pancakes', 'Pretzel', 'Soup', 'Steak', 'Popcorn', 'Bread', 'Sandwich', 'Fries', 'Omelette'],
  },
  {
    id: 'places',
    name: 'Places',
    emoji: '🏙️',
    words: ['Beach', 'Hospital', 'Airport', 'Mall', 'School', 'Library', 'Cinema', 'Restaurant', 'Zoo', 'Museum', 'Train station', 'Stadium', 'Desert', 'Forest', 'Volcano', 'Swimming pool', 'Bank', 'Gym', 'Hotel', 'Market'],
  },
  {
    id: 'jobs',
    name: 'Jobs',
    emoji: '🧑‍⚕️',
    words: ['Doctor', 'Teacher', 'Pilot', 'Police officer', 'Firefighter', 'Chef', 'Taxi driver', 'Engineer', 'Lawyer', 'Photographer', 'Singer', 'Actor', 'Farmer', 'Barber', 'Programmer', 'Astronaut', 'Baker', 'Plumber', 'Painter', 'Lifeguard'],
  },
  {
    id: 'objects',
    name: 'Objects',
    emoji: '🎒',
    words: ['Umbrella', 'Key', 'Phone', 'Glasses', 'Suitcase', 'Clock', 'Chair', 'Mirror', 'Camera', 'Candle', 'Scissors', 'Ball', 'Battery', 'Headphones', 'Toothbrush', 'Laptop', 'Lock', 'Balloon', 'Flashlight', 'Blanket'],
  },
  {
    id: 'sports',
    name: 'Sports',
    emoji: '⚽',
    words: ['Soccer', 'Basketball', 'Tennis', 'Swimming', 'Judo', 'Cycling', 'Running', 'Surfing', 'Skiing', 'Boxing', 'Volleyball', 'Gymnastics', 'Golf', 'Ping pong', 'Pole vault', 'Chess', 'Climbing', 'Hockey', 'Snorkeling', 'Karate'],
  },
];
