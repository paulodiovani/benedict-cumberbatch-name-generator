import systemPrompt from './assets/prompts/default.md?raw';

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

export const SYSTEM_PROMPT = systemPrompt;

export const HISTORY_LIMIT = 8;
