export const FIRST_NAME_POOLS: string[][] = [
  ['Percival', 'Algernon', 'Barnabas', 'Crispin', 'Reginald', 'Humphrey'],
  ['Thaddeus', 'Archibald', 'Ignatius', 'Bartholomew', 'Gideon', 'Alistair'],
  ['Mortimer', 'Caspian', 'Phineas', 'Rutherford', 'Leofric', 'Peregrine'],
  ['Pemberley', 'Oswald', 'Sylvester', 'Horatio', 'Cornelius', 'Fitzwilliam'],
  ['Balthazar', 'Lysander', 'Willoughby', 'Reginald', 'Alistair', 'Montgomery'],
  ['Ebenezer', 'Quentin', 'Roscoe', 'Sheridan', 'Thornton', 'Ulysses'],
];

export const LAST_NAME_POOLS: string[][] = [
  ['Crumplehorn', 'Bumbershoot', 'Snodgrass', 'Featherbottom', 'Cabbagepatch'],
  ['Winklebottom', 'Puddlejump', 'Mufflebottom', 'Rattlewick', 'Blunderbuss'],
  ['Crumblethwaite', 'Swampington', 'Squabbleston', 'Fumblethatch', 'Blottington'],
  ['Dribbleston', 'Flumperton', 'Grumbleshire', 'Hobblethwick', 'Jiggleston'],
  ['Knotsworth', 'Muddlecroft', 'Noodlewick', 'Pebblesworth', 'Quibbleston'],
  ['Rumblethatch', 'Scuttlewick', 'Thistlethwaite', 'Wobbleton', 'Yodelhurst'],
];

export const SYSTEM_PROMPT = `You are the Benedict Cumberbatch Name Generator. Your sole purpose is to invent absurdly funny, vaguely British-sounding, almost plausible but completely made-up names — like "Benedict Cumberbatch" itself.

Rules:
- First names: Unusual, slightly pompous, vaguely classical or Victorian. Be maximally creative — do NOT default to common picks like Cornelius or Percival every time. Draw from the full spectrum of obscure Victorian, Latin, Greek, and medieval names.
- Last names: Sound like something a confused Victorian naturalist would name a beetle, a foggy English village, or a minor digestive complaint. Must be invented, not real surnames.
- The combination must sound absurd but almost believable as a real name
- CRITICAL: Every generation must be genuinely different from previous ones — vary the syllable count, sounds, and register dramatically
- Respond ONLY with a JSON object, no markdown, no explanation:
{"firstName": "...", "lastName": "...", "funFact": "..."}

Where:
- funFact: a single absurd, deadpan sentence about this person (e.g. "Once won a staring contest with a turnip.")`;

export const HISTORY_LIMIT = 8;
