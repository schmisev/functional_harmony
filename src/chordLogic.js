const WHOLE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B',];
export const ROMAN_NOTES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const ROMAN_SECONDARY = [
    [false, ''],
    [true, ''],
    [true, ''],
    [false, ''],
    [false, ''],
    [true, ''],
    [true, '°'],
]
const QUICK_NOTES = ['C', 'C#/Db', 'D','D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B',];
const MODS = ['', '#', 'x', '(3#)', '(4#)', '(3#)', '(4#)', '(5#|5b)', '(4b)', '(3b)', 'bb', 'b',];
const CHORDS = [
    ['maj7', '6'],
    ['m7', 'm6'],
    ['m7'],
    ['maj7', '6'], 
    ['7', '6'],
    ['m7'],
    ['dim7'],
];

const WHOLE_NOTE_TO_REAL_INDICES = [0, 2, 4, 5, 7, 9, 11];

const OCTAVE = 7;
const REAL_OCTAVE = 12;

const HEPTATONIC_SCALE = [2, 2, 1, 2, 2, 2, 1];
const HEPTATONIC_MODES = [
    ["Ionian", "major"],
    ["Dorian"],
    ["Phrygian"],
    ["Lydian"],
    ["Mixolydian"],
    ["Aeolian", "minor"],
    ["Locrian"],
];

export const WHOLE_NOTE_SELECT = WHOLE_NOTES.map((n, i) => [n, i]);
export const MOD_SELECT = [
    ['x', 2],
    ['#', 1],
    ['~', 0],
    ['b', -1],
    ['bb', -2],
]

const modulo = (x, y) => ((x%y)+y)%y;

const heptaToDodeca = function(wni, mi) {
    return modulo(WHOLE_NOTE_TO_REAL_INDICES[modulo(wni, OCTAVE)] + mi, REAL_OCTAVE);
}

export const generateChordScale = function(mode, wni, mi) {
    var scale = [];
    var acc = 0; // half step accumulator
    var si = 0; // scale index

    for (var i = 0; i < OCTAVE; i++) {
        si = modulo(i + mode, OCTAVE); // scale index
        
        // Building the chord
        var chord = {};

        // index section
        chord.wni = modulo(wni + i, OCTAVE); // whole note index [0, 7]
        chord.rni = heptaToDodeca(wni, acc + mi); // real note index [0, 11]
        chord.rwni = heptaToDodeca(chord.wni, 0); // real whole note index [0, 11]
        chord.mi = modulo(chord.rni - chord.rwni, REAL_OCTAVE); // mod index [0, 11]

        // name section
        chord.wholeNote = WHOLE_NOTES[chord.wni]; // whole note name
        chord.mod = MODS[chord.mi]; // mod name
        chord.possibleChords = CHORDS[si]; // list of possible chords
        chord.bareRoman = ROMAN_NOTES[i]; // roman symbol
        chord.secRoman = (ROMAN_SECONDARY[si][0] ? chord.bareRoman.toLowerCase() : chord.bareRoman).concat(ROMAN_SECONDARY[si][1]);

        scale.push(chord);

        // Updating the accumulator
        acc += HEPTATONIC_SCALE[si];
    }

    return scale;
}

export const generateModeMatrix = function(wni, mi) {
    var modes = [];

    for (var i = 0; i < OCTAVE; i++) {
        var mode = {};

        // index section
        mode.i = i;

        // name section
        mode.name = HEPTATONIC_MODES[i];
        mode.chordScale = generateChordScale(i, wni, mi);

        modes.push(mode);
    }

    return modes;
}