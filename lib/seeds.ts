export const FIRST_NAMES: readonly string[] = [
  'Percival', 'Algernon', 'Barnabas', 'Crispin', 'Reginald', 'Humphrey',
  'Thaddeus', 'Archibald', 'Ignatius', 'Bartholomew', 'Gideon', 'Alistair',
  'Mortimer', 'Caspian', 'Phineas', 'Rutherford', 'Leofric', 'Peregrine',
  'Pemberley', 'Oswald', 'Sylvester', 'Horatio', 'Cornelius', 'Fitzwilliam',
  'Balthazar', 'Lysander', 'Willoughby', 'Montgomery',
  'Ebenezer', 'Quentin', 'Roscoe', 'Sheridan', 'Thornton', 'Ulysses',
];

export const LAST_NAMES: readonly string[] = [
  'Crumplehorn', 'Bumbershoot', 'Snodgrass', 'Featherbottom', 'Cabbagepatch',
  'Winklebottom', 'Puddlejump', 'Mufflebottom', 'Rattlewick', 'Blunderbuss',
  'Crumblethwaite', 'Swampington', 'Squabbleston', 'Fumblethatch', 'Blottington',
  'Dribbleston', 'Flumperton', 'Grumbleshire', 'Hobblethwick', 'Jiggleston',
  'Knotsworth', 'Muddlecroft', 'Noodlewick', 'Pebblesworth', 'Quibbleston',
  'Rumblethatch', 'Scuttlewick', 'Thistlethwaite', 'Wobbleton', 'Yodelhurst',
];

export const FUN_FACTS: readonly string[] = [
  'Once won a staring contest with a turnip.',
  'Believes pigeons are tax collectors in disguise.',
  'Has never forgiven a particular church bell.',
  'Invented a soup that briefly defeated a duke.',
  'Keeps a ledger of every cloud he has mistrusted.',
  'Refuses to acknowledge Wednesdays on principle.',
  'Once lost a duel to a hedge.',
  'Considers the letter Q personally hostile.',
  'Owns three umbrellas, all named Geoffrey.',
  'Was briefly engaged to a chandelier.',
  'Suspects the moon of plagiarism.',
  'Carries a single walnut for emergencies.',
  'Has been escorted out of two libraries and a swamp.',
  'Maintains a rivalry with a specific stone.',
  'Speaks fluent goose, but only on Tuesdays.',
  'Was once mistaken for a coatrack at his own wedding.',
  'Believes that fog is judgemental.',
  'Refuses to enter rooms shaped like apologies.',
  'Holds the regional record for fainting near soup.',
  'Once tried to challenge the wind to a debate.',
  'Insists that ducks have been keeping notes.',
  'Wrote a letter of complaint to the equator.',
  'Has a deep suspicion of pleasantly warm afternoons.',
  'Was banned from a cathedral for excessive sighing.',
  'Believes punctuation can be witnessed but not trusted.',
  'Once misplaced a small county.',
  'Has never been on speaking terms with his own knees.',
  'Refers to all biscuits by their full Christian names.',
  'Was briefly the unwilling mascot of a regimental band.',
  'Maintains that gravity is a phase.',
];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildSeedHint(): string {
  const firstName = pickRandom(FIRST_NAMES);
  const lastName = pickRandom(LAST_NAMES);
  const funFact = pickRandom(FUN_FACTS);
  return [
    `For inspiration this time, consider names in the spirit of "${firstName}" and "${lastName}" — but feel free to invent something entirely different and more surprising.`,
    `For tone, take a fun fact like "${funFact}" as a starting point — then reach for something stranger and more unexpected of your own.`,
  ].join(' ');
}
