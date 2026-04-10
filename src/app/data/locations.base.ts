export type Mode = 'eat' | 'focus' | 'chill';

export interface BaseLocation {
  id: string;
  mode: Mode;
  name: string;
  features: string[];
}

export const BASE_LOCATIONS: BaseLocation[] = [
  // Eat (27)
  { id: 'avo', mode: 'eat', name: 'Avo Armenian Food', features: [] },
  { id: 'piatsa', mode: 'eat', name: 'Piatsa Gourounaki', features: [] },
  { id: 'zanettos', mode: 'eat', name: 'Zanettos Tavern', features: [] },
  { id: 'toanamma', mode: 'eat', name: 'To Anamma', features: [] },
  { id: 'elysian', mode: 'eat', name: 'Elysian Fusion Kitchen', features: [] },
  { id: 'furen', mode: 'eat', name: 'Furen', features: [] },
  { id: 'bellavita', mode: 'eat', name: 'Bella Vita', features: [] },
  { id: 'evroula', mode: 'eat', name: 'Evroula', features: [] },
  { id: 'mattheos', mode: 'eat', name: 'Mattheos Restaurant', features: [] },
  { id: 'shamfood', mode: 'eat', name: 'Sham Food', features: [] },
  { id: 'obokitchen', mode: 'eat', name: 'Øbo Kitchen', features: [] },
  { id: 'platanos', mode: 'eat', name: 'Platanos Tavern', features: [] },
  { id: 'syrianclub', mode: 'eat', name: 'Syrian Club', features: [] },
  { id: 'omnieats', mode: 'eat', name: 'Omni Eats', features: [] },
  { id: 'kathodon', mode: 'eat', name: 'Kathodon', features: [] },
  { id: 'beba', mode: 'eat', name: 'Beba Restaurant', features: [] },
  { id: 'vasiliki', mode: 'eat', name: 'Vasiliki', features: [] },
  { id: 'imperialchinese', mode: 'eat', name: 'Imperial Chinese Nicosia', features: [] },
  { id: 'akakiko', mode: 'eat', name: 'Akakiko', features: [] },
  { id: 'indiaindia', mode: 'eat', name: 'India India', features: [] },
  { id: 'fanous', mode: 'eat', name: 'Fanous Lebanese Restaurant', features: [] },
  { id: 'kyriakos', mode: 'eat', name: 'Kyriakos Souvlaki', features: [] },
  { id: 'rokoko', mode: 'eat', name: 'Rokoko', features: [] },
  { id: 'moondogs', mode: 'eat', name: "Moondog's Bar & Grill", features: [] },
  { id: 'nomiya', mode: 'eat', name: 'Nomiya', features: [] },
  { id: 'valtourigani', mode: 'eat', name: 'Valtou Rigani', features: [] },
  { id: 'fatbull', mode: 'eat', name: 'The Fat Bull Co.', features: [] },

  // Focus (27)
  { id: 'yfantourgeio', mode: 'focus', name: 'Yfantourgeio', features: [] },
  { id: 'brewlab', mode: 'focus', name: 'Brew Lab', features: [] },
  { id: 'workshop', mode: 'focus', name: 'The Workshop Cafe', features: [] },
  { id: 'think30', mode: 'focus', name: 'Think 30', features: [] },
  { id: 'kofee', mode: 'focus', name: 'A Kxoffee Project', features: [] },
  { id: 'hub', mode: 'focus', name: 'The Hub Nicosia', features: [] },
  { id: 'pieto', mode: 'focus', name: 'Pieto Coffee', features: [] },
  { id: 'beanbar', mode: 'focus', name: 'Bean Bar Coffee', features: [] },
  { id: 'coffeelab', mode: 'focus', name: 'Coffee Lab Nicosia', features: [] },
  { id: 'ucylibrary', mode: 'focus', name: 'UCY Library (Stelios Ioannou)', features: [] },
  { id: 'nmlibrary', mode: 'focus', name: 'Nicosia Municipal Library', features: [] },
  { id: 'cypruslibrary', mode: 'focus', name: 'Cyprus Library', features: [] },
  { id: 'cvarlibrary', mode: 'focus', name: 'CVAR Research Library', features: [] },
  { id: 'goethelibrary', mode: 'focus', name: 'Goethe-Institut Library', features: [] },
  { id: 'dailyroast', mode: 'focus', name: 'The Daily Roast', features: [] },
  { id: 'katakwa', mode: 'focus', name: 'Katakwa Culture Art Cafe', features: [] },
  { id: 'caffeneroengomi', mode: 'focus', name: 'Caffe Nero (Engomi)', features: [] },
  { id: 'redsheep', mode: 'focus', name: 'Red Sheep Coffee Co.', features: [] },
  { id: 'seriousblack', mode: 'focus', name: 'Serious Black Coffee', features: [] },
  { id: 'tastehabitat', mode: 'focus', name: 'Coffeehouse TasteHabitat', features: [] },
  { id: 'starbucksengomi', mode: 'focus', name: 'Starbucks (Engomi)', features: [] },
  { id: 'mikelengomi', mode: 'focus', name: 'Mikel Coffee (Engomi)', features: [] },
  { id: 'apomero', mode: 'focus', name: 'Apomero Cafe', features: [] },
  { id: 'kalakathoumena', mode: 'focus', name: 'Kala Kathoumena', features: [] },
  { id: 'paulzenapalace', mode: 'focus', name: 'Paul (Zena Palace)', features: [] },
  { id: 'supernova', mode: 'focus', name: 'Supernova Cafe', features: [] },
  { id: 'makerspace', mode: 'focus', name: 'Makerspace Nicosia', features: [] },

  // Chill (27)
  { id: 'k11', mode: 'chill', name: 'Kafeneio 11', features: [] },
  { id: 'balza', mode: 'chill', name: 'Bálza Rooftop Bar', features: [] },
  { id: 'halara', mode: 'chill', name: 'Halara Cafe', features: [] },
  { id: 'municipal', mode: 'chill', name: 'Nicosia Municipal Gardens', features: [] },
  { id: 'taratsa', mode: 'chill', name: 'Taratsa Rooftop Bar', features: [] },
  { id: 'famagusta', mode: 'chill', name: 'Famagusta Gate Area', features: [] },
  { id: 'lostfound', mode: 'chill', name: 'Lost + Found Drinkery', features: [] },
  { id: 'eleftheria', mode: 'chill', name: 'Eleftheria Square', features: [] },
  { id: 'zonkey', mode: 'chill', name: 'Zonkey Bar', features: [] },
  { id: 'athalassa', mode: 'chill', name: 'Athalassa National Forest Park', features: [] },
  { id: 'acropolis', mode: 'chill', name: 'Acropolis Park Nicosia', features: [] },
  { id: 'oldsouls', mode: 'chill', name: 'The Old Souls', features: [] },
  { id: 'notesandspirits', mode: 'chill', name: 'Notes and Spirits', features: [] },
  { id: 'palaia', mode: 'chill', name: 'Palaia Pineza', features: [] },
  { id: 'istorja', mode: 'chill', name: 'Istorja House No9', features: [] },
  { id: 'babylon', mode: 'chill', name: 'Babylon Bar', features: [] },
  { id: 'patio', mode: 'chill', name: 'Patio Cocktail Bar', features: [] },
  { id: 'prozak', mode: 'chill', name: 'Prozak Kafeneio', features: [] },
  { id: 'swimmingbirds', mode: 'chill', name: 'Swimming Birds', features: [] },
  { id: 'brewfellas', mode: 'chill', name: 'BrewFellas', features: [] },
  { id: 'granazi', mode: 'chill', name: 'Granazi Art Space', features: [] },
  { id: 'thegym', mode: 'chill', name: 'The Gym', features: [] },
  { id: 'silverstar', mode: 'chill', name: 'Silver Star Wine Bar', features: [] },
  { id: 'sevenmonkeys', mode: 'chill', name: 'Seven Monkeys The Bar', features: [] },
  { id: 'sarahsjazz', mode: 'chill', name: "Sarah's Jazz Club", features: [] },
  { id: 'neverland', mode: 'chill', name: 'Neverland Rock Bar', features: [] },
  { id: 'newdivision', mode: 'chill', name: 'New Division', features: [] },
];

export const LOCATION_NAMES: Record<string, string> = Object.fromEntries(
  BASE_LOCATIONS.map((l) => [l.id, l.name])
);

