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

export const FUN_FACT_POOLS: string[][] = [
  [
    'Once won a staring contest with a turnip.',
    'Believes pigeons are tax collectors in disguise.',
    'Has never forgiven a particular church bell.',
    'Invented a soup that briefly defeated a duke.',
    'Keeps a ledger of every cloud he has mistrusted.',
  ],
  [
    'Refuses to acknowledge Wednesdays on principle.',
    'Once lost a duel to a hedge.',
    'Considers the letter Q personally hostile.',
    'Owns three umbrellas, all named Geoffrey.',
    'Was briefly engaged to a chandelier.',
  ],
  [
    'Suspects the moon of plagiarism.',
    'Carries a single walnut for emergencies.',
    'Has been escorted out of two libraries and a swamp.',
    'Maintains a rivalry with a specific stone.',
    'Speaks fluent goose, but only on Tuesdays.',
  ],
  [
    'Was once mistaken for a coatrack at his own wedding.',
    'Believes that fog is judgemental.',
    'Refuses to enter rooms shaped like apologies.',
    'Holds the regional record for fainting near soup.',
    'Once tried to challenge the wind to a debate.',
  ],
  [
    'Insists that ducks have been keeping notes.',
    'Wrote a letter of complaint to the equator.',
    'Has a deep suspicion of pleasantly warm afternoons.',
    'Was banned from a cathedral for excessive sighing.',
    'Believes punctuation can be witnessed but not trusted.',
  ],
  [
    'Once misplaced a small county.',
    'Has never been on speaking terms with his own knees.',
    'Refers to all biscuits by their full Christian names.',
    'Was briefly the unwilling mascot of a regimental band.',
    'Maintains that gravity is a phase.',
  ],
];

export const SYSTEM_PROMPT = systemPrompt;

export const HISTORY_LIMIT = 8;
