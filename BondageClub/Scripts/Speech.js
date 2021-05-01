"use strict";

/**
 * A lookup mapping the gag effect names to their corresponding gag level numbers.
 * @type {Object.<string,number>}
 * @constant
 */
var SpeechGagLevelLookup = {
	GagTotal4: 20,
	GagTotal3: 16,
	GagTotal2: 12,
	GagTotal: 8,
	GagVeryHeavy: 7,
	GagHeavy: 6,
	GagMedium: 5,
	GagNormal: 4,
	GagEasy: 3,
	GagLight: 2,
	GagVeryLight: 1,
};

/**
 * Analyzes a phrase to determine if it is a full emote. A full emote is a phrase wrapped in "()"
 * @param {string} D - A phrase
 * @returns {boolean} - Returns TRUE if the current speech phrase is a full emote (all between parentheses)
 */
function SpeechFullEmote(D) {
	return ((D.indexOf("(") == 0) && (D.indexOf(")") == D.length - 1));
}

/**
 * Returns the gag level corresponding to the given effect array, or 0 if the effect array contains no gag effects
 * @param {string} Effect - The effect to lookup the gag level for
 * @return {number} - The gag level corresponding to the given effects
 */
function SpeechGetEffectGagLevel(Effect) {
	return Effect.reduce((Modifier, EffectName) => Modifier + (SpeechGagLevelLookup[EffectName] || 0), 0);
}

/**
 * Gets the cumulative gag level of an asset group. Each gagging effect has a specific numeric value. The following
 * Effect arrays are used for the calculation, (higher on this list means that effect array will override the others):
 *     - Item.Property.Effect
 *     - Item.Asset.Effect
 *     - Item.Asset.Group.Effect
 * @param {Character} C - The character, whose assets are used for the check
 * @param {string} AssetGroup - The name of the asset group to look through
 * @returns {number} - Returns the total gag effect of the character's assets
 */
 function SpeechGetGagLevel(C, AssetGroup) {
	var GagEffect = 0;
	for (let i = 0; i < C.Appearance.length; i++) {
		var item = C.Appearance[i];
		if (item.Asset.Group.Name === AssetGroup) {
			var EffectArray = [];
			if (item.Property &&
				Array.isArray(item.Property.Effect) &&
				!(typeof item.Property.Type === "undefined")
			) EffectArray = item.Property.Effect;
			else if (Array.isArray(item.Asset.Effect)) EffectArray = item.Asset.Effect;
			else if (Array.isArray(item.Asset.Group.Effect)) EffectArray = item.Asset.Group.Effect;
			GagEffect += SpeechGetEffectGagLevel(EffectArray);
			break;
		}
	}
	return GagEffect;
}

function SpeechGetGagEffect(C, NoDeaf) {

	let GagEffect = 0;
	
	GagEffect += SpeechGetGagLevel(C, "ItemMouth");
	GagEffect += SpeechGetGagLevel(C, "ItemMouth2");
	GagEffect += SpeechGetGagLevel(C, "ItemMouth3");
	GagEffect += SpeechGetGagLevel(C, "ItemHead");
	GagEffect += SpeechGetGagLevel(C, "ItemHood");
	GagEffect += SpeechGetGagLevel(C, "ItemNeck");
	GagEffect += SpeechGetGagLevel(C, "ItemDevices");
	GagEffect += SpeechGetGagLevel(C, "ItemHoodAddon");
	
	if (C.ID != 0 && !NoDeaf) {
		if (Player.GetDeafLevel() >= 7) GagEffect = Math.max(GagEffect, 20);
		else if (Player.GetDeafLevel() >= 6) GagEffect = Math.max(GagEffect, 16);
		else if (Player.GetDeafLevel() >= 5) GagEffect = Math.max(GagEffect, 12);
		else if (Player.GetDeafLevel() >= 4) GagEffect = Math.max(GagEffect, 8);
		else if (Player.GetDeafLevel() >= 3) GagEffect = Math.max(GagEffect, 6);
		else if (Player.GetDeafLevel() >= 2) GagEffect = Math.max(GagEffect, 4);
		else if (Player.GetDeafLevel() >= 1) GagEffect = Math.max(GagEffect, 2);
	}

	return GagEffect;
}

/**
 * Processes the character's speech, anything between parentheses isn't touched. Effects alter the speech differently according to a character's language. Effects that can be applied are the following: gag talk, baby talk and stuttering.
 * @param {Character} C - The character, whose dialog might need to be altered
 * @param {string} CD - The character's dialog to alter
 * @returns {string} - Returns the dialog after speech effects were processed (Garbling, Stuttering, Baby talk)
 */
function SpeechGarble(C, CD, NoDeaf) {

	let GagEffect = 0;
	let NS = CD;

	// The usual preamble - calculate the gag effect level, and the character's deafness level once
	GagEffect = SpeechGetGagEffect(C, NoDeaf);
	
	// Makes sure that the gag level is within acceptable parameters. As a GagEffect of more than 20 does nothing. So reduces it if above 20.
	if (GagEffect > 20) GagEffect = 20;
	
	// If GagEffect is 0 then there is no need to run this part so, a simple if statement is used in order to check.
	if (GagEffect > 0)  {

		// This is a function which transforms a single character - one of the `switch` statements
		const garblingFunction = SpeechGetGarblingFunction(GagEffect);

		// This encapsulates the `for` loop logic - it runs over each character and runs the garbling function on it
		NS = SpeechGarbleLine(CD, garblingFunction);
	}
	NS = SpeechStutter(C, NS);
	NS = SpeechBabyTalk(C, NS);
	
	return NS;

}

/**
 * Chooses the correct function to run via a switch statement and returns it when found.
 * @param {GagEffect} The already caculated value that is used to determine the correct function.
 * @returns {string} - Returns the correct garbling function to run.
 */
function SpeechGetGarblingFunction(GagEffect) {

	let CorrectFunction;
	
	switch(GagEffect) {
		case 20:
			CorrectFunction = SpeechGarble20;
			break;
		case 19: case 18: case 17: case 16:
			CorrectFunction = SpeechGarble16;
			break;
		case 15: case 14: case 13: case 12:
			CorrectFunction = SpeechGarble12;
			break;
		case 11: case 10: case 9: case 8:
			CorrectFunction = SpeechGarble8;
			break;
		case 7:
			CorrectFunction = SpeechGarble7;
			break;
		case 6:
			CorrectFunction = SpeechGarble6;
			break;
		case 5:
			CorrectFunction = SpeechGarble5;
			break;
		case 4:
			CorrectFunction = SpeechGarble4;
			break;
		case 3:
			CorrectFunction = SpeechGarble3;
			break;
		case 2:
			CorrectFunction = SpeechGarble2;
			break;
		case 1:
			CorrectFunction = SpeechGarble1;
			break;
	}
	
	return CorrectFunction;
}

/**
 * This runs the for loop that actually garbles the text and returns NS when done to SpeechGarble.
 * @param {CD} The message itself.
 * @param {garblingFunction} The string that tells which function to run.
 * @returns {string} - Returns the dialog after garbling was processed.
 */
function SpeechGarbleLine(CD, garblingFunction, IgnoreOOC) {

	var NS = "";
	var Par = false;
	if (CD == null) CD = "";
	
	for (let L = 0; L < CD.length; L++) {
		let H = CD.charAt(L);
		if (H == "(" && !IgnoreOOC) Par = true;

		if (Par) NS = NS + CD.charAt(L);
		else NS = NS + garblingFunction(H);
		if (H == ")") Par = false;
	}
	return NS;
}

/**
 * GagEffect20 always returns mmmmm and muffles some frequent letters entirely, 75% least frequent letters
 */
 function SpeechGarble20(H) {
	switch(H) {
		case " ": case ".": case "?": case "!": case "~": case "-": 
			break;
		case "z": case "q": case "j": case "x": case "k": case "v": case "b": case "y": case "w": case "g": case "p": case "f": case "u": case "c": case "d": case "l": case "h": case "r": case "Z": case "Q": case "J": case "X": case "K": case "V": case "B": case "Y": case "W": case "G": case "P": case "F": case "U": case "C": case "D": case "L": case "H": case "R": 
			H = " ";
			break;
		default: 
			H = "m";
			break;
	}
	return H;
}

/**
 * GagEffect16 always returns mmmmm and muffles some relatively frequent letters entirely, 50% least frequent letters
 */
function SpeechGarble16(H) {
	switch(H) {
		case " ": case ".": case "?": case "!": case "~": case "-": 
			break;
		case "z": case "q": case "j": case "x": case "k": case "v": case "b": case "y": case "w": case "g": case "p": case "f": case "Z": case "Q": case "J": case "X": case "K": case "V": case "B": case "Y": case "W": case "G": case "P": case "F": 
			H = " ";
			break;
		default: 
			H = "m";
			break;
	}
	return H;
}

/**
 * GagEffect12 always returns mmmmm and muffles some less frequent letters entirely; 25% least frequent letters
 */
function SpeechGarble12(H) {
	switch(H) {
		case " ": case ".": case "?": case "!": case "~": case "-": 
			break;
		case "z": case "q": case "j": case "x": case "k": case "v": case "Z": case "Q": case "J": case "X": case "K": case "V": 
			H = " ";
			break;
		default: 
			H = "m";
			break;
	}
	return H;
}

/**
 * GagEffect8 always returns mmmmm
 */
function SpeechGarble8(H) {
	switch(H) {
		case " ": case ".": case "?": case "!": case "~": case "-": 
			break;
		default: 
			H = "m";
			break;
	}
	return H;
}

/**
 * GagEffect7 close to no letter stays the same
 */
function SpeechGarble7(H) {
	switch(H) {

		// Regular characters
		case "a": case "e": case "i": case "o": case "u": case "y": 
			H = "e";
			break;
		case "j": case "k": case "l": case "r": 
			H = "a";
			break;
		case "s": case "z": case "h": 
			H = "h";
			break;
		case "d": case "f": case "g": case "n": case "m": case "w": case "t": case "c": case "q": case "x": case "p": case "v": 
			H = "m";
			break;
		case " ": case ".": case "?": case "!": case "~": case "-": case "b": 
			break;
		case "A": case "E": case "I": case "O": case "U": case "Y": 
			H = "E";
			break;
		case "J": case "K": case "L": case "R": 
			H = "A";
			break;
		case "S": case "Z": case "H": 
			H = "H";
			break;
		case "D": case "F": case "G": case "N": case "M": case "W": case "T": case "C": case "Q": case "X": case "P": case "V": 
			H = "M";
			break;
		case "B":
			break;

		// Accents/Latin characters
		case "á": case "â": case "à": case "é": case "ê": case "è": case "ë": case "í": case "î": case "ì": case "ï": case "ó": case "ô": case "ò": case "ú": case "û": case "ù": case "ü": 
			H = "e";
			break;
		case "ç": 
			H = "h";
			break;
		case "ñ": 
			H = "m";
			break;
		case "Á": case "Â": case "À": case "É": case "Ê": case "È": case "Ë": case "Í": case "Î": case "Ì": case "Ï": case "Ó": case "Ô": case "Ò": case "Ú": case "Û": case "Ù": case "Ü": 
			H = "E";
			break;
		case "Ç": 
			H = "H";
			break;
		case "Ñ": 
			H = "M";
			break;

		// Cyrillic characters
		case "и": case "о": case "у": case "ю": case "л": case "я": 
			H = "е";
			break;
		case "с": case "й": case "х": 
			H = "к";
			break;
		case "ж": case "р":
			H = "а";
			break;
		case "з":
			H = "г";
			break;
		case "б": case "в": case "ы": 
			H = "ф";
			break;
		case "д": case "ф": case "н":
			H = "м";
			break;
		case "И": case "О": case "У": case "Ю": case "Л": case "Я": 
			H = "Е";
			break;
		case "С": case "Й": case "Х": 
			H = "К";
			break;
		case "Ж": case "Р": 
			H = "А";
			break;
		case "З":
			H = "Г";
			break;
		case "Б": case "В": case "Ы": 
			H = "Ф";
			break;
		case "Д": case "Ф": case "Н":
			H = "М";
			break;
	}
	return H;
}

/**
 * GagEffect6 almost no letter stays the same
 */
function SpeechGarble6(H) {
	switch(H) {

		// Regular characters
		case "a": case "e": case "i": case "o": case "u": case "y": case "t": 
			H = "e";
			break;
		case "c": case "q": case "x": 
			H = "k";
			break;
		case "j": case "k": case "l": case "r": case "w": 
			H = "a";
			break;
		case "s": case "z": case "h": 
			H = "h";
			break;
		case "b": case "p": case "v": 
			H = "f";
			break;
		case "d": case "f": case "g": case "n": case "m": 
			H = "m";
			break;
		case " ": case ".": case "?": case "!": case "~": case "-": 
			break;
		case "A": case "E": case "I": case "O": case "U": case "Y": case "T": 
			H = "E";
			break;
		case "C": case "Q": case "X": 
			H = "K";
			break;
		case "J": case "K": case "L": case "R": case "W": 
			H = "A";
			break;
		case "S": case "Z": case "H": 
			H = "H";
			break;
		case "B": case "P": case "V": 
			H = "F";
			break;
		case "D": case "F": case "G": case "N": case "M": 
			H = "M";
			break;

		// Accents/Latin characters
		case "á": case "â": case "à": case "é": case "ê": case "è": case "ë": case "í": case "î": case "ì": case "ï": case "ó": case "ô": case "ò": case "ú": case "û": case "ù": case "ü": 
			H = "e";
			break;
		case "ç": 
			H = "h";
			break;
		case "ñ": 
			H = "m";
			break;
		case "Á": case "Â": case "À": case "É": case "Ê": case "È": case "Ë": case "Í": case "Î": case "Ì": case "Ï": case "Ó": case "Ô": case "Ò": case "Ú": case "Û": case "Ù": case "Ü": 
			H = "E";
			break;
		case "Ç": 
			H = "H";
			break;
		case "Ñ": 
			H = "M";
			break;

		// Cyrillic characters
		case "а": case "е": case "и": case "о": case "у": case "ю": case "л": case "я": 
			H = "е";
			break;
		case "с": case "й": case "х": 
			H = "к";
			break;
		case "ж": case "л": case "р":
			H = "а";
			break;
		case "з": case "с": case "й": 
			H = "г";
			break;
		case "б": case "в": case "ы": 
			H = "ф";
			break;
		case "д": case "н": case "м": 
			H = "м";
			break;
		case "А": case "Е": case "И": case "О": case "У": case "Ю": case "Л": case "Я": 
			H = "Е";
			break;
		case "С": case "Й": case "Х": 
			H = "К";
			break;
		case "Ж": case "Л": case "Р":
			H = "А";
			break;
		case "З": case "С": case "Й": 
			H = "Г";
			break;
		case "Б": case "В": case "Ы": 
			H = "Ф";
			break;
		case "Д": case "Н": case "М": 
			H = "М";
			break;
	}
	return H;
}

/**
 * GagEffect5 some letters stays the same
 */
function SpeechGarble5(H) {
	switch(H) {

		// Regular characters
		case "e": case "i": case "o": case "u": case "y": case "t": 
			H = "e";
			break;
		case "c": case "q": case "x": case "k": 
			H = "k";
			break;
		case "j": case "l": case "r": case "w": case "a": 
			H = "a";
			break;
		case "s": case "z": case "h": 
			H = "h";
			break;
		case "b": case "p": case "v": 
			H = "f";
			break;
		case "d": case "f": case "g": case "m": 
			H = "m";
			break;
		case "n": case " ": case ".": case "?": case "!": case "~": case "-":
			break;
		case "E": case "I": case "O": case "U": case "Y": case "T": 
			H = "E";
			break;
		case "C": case "Q": case "X": case "K": 
			H = "K";
			break;
		case "J": case "L": case "R": case "W": case "A": 
			H = "A";
			break;
		case "S": case "Z": case "H": 
			H = "H";
			break;
		case "B": case "P": case "V": 
			H = "F";
			break;
		case "D": case "F": case "G": case "M": 
			H = "M";
			break;
		case "N": 
			break;

		// Accents/Latin characters
		case "á": case "â": case "à": case "é": case "ê": case "è": case "ë": case "í": case "î": case "ì": case "ï": case "ó": case "ô": case "ò": case "ú": case "û": case "ù": case "ü": 
			H = "e";
			break;
		case "ç": 
			H = "h";
			break;
		case "ñ": 
			H = "m";
			break;
		case "Á": case "Â": case "À": case "É": case "Ê": case "È": case "Ë": case "Í": case "Î": case "Ì": case "Ï": case "Ó": case "Ô": case "Ò": case "Ú": case "Û": case "Ù": case "Ü": 
			H = "E";
			break;
		case "Ç": 
			H = "H";
			break;
		case "Ñ": 
			H = "M";
			break;

		// Cyrillic characters
		case "а": case "е": case "и": case "о": case "у": case "ю": case "л": case "я": 
			H = "е";
			break;
		case "с": case "й": case "х": 
			H = "к";
			break;
		case "ж":case "л": case "р":
			H = "а";
			break;
		case "з": case "й": 
			H = "г";
			break;
		case "б": case "р": case "в": case "ы": 
			H = "ф";
			break;
		case "д":case "н":
			H = "м";
			break;
		case "А": case "Е": case "И": case "О": case "У": case "Ю": case "Л": case "Я": 
			H = "Е";
			break;
		case "С": case "Й": case "Х": 
			H = "К";
			break;
		case "Ж":case "Л": case "Р":
			H = "А";
			break;
		case "З": case "Й": 
			H = "Г";
			break;
		case "Б": case "Р": case "В": case "Ы": 
			H = "Ф";
			break;
		case "Д": case "Н":
			H = "М";
			break;
	}
	return H;
}

/**
 * GagEffect4 keep vowels and a few letters the same
 */
function SpeechGarble4(H) {
	switch(H) {

		// Regular characters
		case "v": case "b": case "c": case "t": 
			H = "e";
			break;
		case "q": case "k": case "x": 
			H = "k";
			break;
		case "w": case "y": case "j": case "l": case "r": 
			H = "a";
			break;
		case "s": case "z": 
			H = "h";
			break;
		case "d": case "f": 
			H = "m";
			break;
		case "p": 
			H = "f";
			break;
		case "g": 
			H = "n";
			break;
		case "a": case "e": case "i": case "o": case "u": case "m": case "n": case "h": case " ": case "!": case "?": case ".": case "~": case "-":
			break;
		case "V": case "B": case "C": case "T": 
			H = "E";
			break;
		case "Q": case "K": case "X": 
			H = "K";
			break;
		case "W": case "Y": case "J": case "L": case "R": 
			H = "A";
			break;
		case "S": case "Z": 
			H = "H";
			break;
		case "D": case "F": 
			H = "M";
			break;
		case "P": 
			H = "F";
			break;
		case "G": 
			H = "N";
			break;
		case "A": case "E": case "I": case "O": case "U": case "M": case "N": case "H": 
			break;

		// Accents/Latin characters
		case "á": case "â": case "à": 
			H = "a";
			break;
		case "é": case "ê": case "è": case "ë": 
			H = "e";
			break;
		case "í": case "î": case "ì": case "ï": 
			H = "i";
			break;
		case "ó": case "ô": case "ò": 
			H = "o";
			break;
		case "ú": case "û": case "ù": case "ü": 
			H = "u";
			break;
		case "ç": 
			H = "s";
			break;
		case "ñ": 
			H = "n";
			break;
		case "Á": case "Â": case "À": 
			H = "A";
			break;
		case "É": case "Ê": case "È": case "Ë": 
			H = "E";
			break;
		case "Í": case "Î": case "Ì": case "Ï": 
			H = "I";
			break;
		case "Ó": case "Ô": case "Ò": 
			H = "O";
			break;
		case "Ú": case "Û": case "Ù": case "Ü": 
			H = "U";
			break;
		case "Ç": 
			H = "S";
			break;
		case "Ñ": 
			H = "N";
			break;

		// Cyrillic characters
		case "в": case "ф": case "б": case "п": 
			H = "фы";
			break;
		case "г": case "к": case "х": 
			H = "к";
			break;
		case "в": case "у": case "ж": case "л": case "р": 
			H = "а";
			break;
		case "с": case "я": 
			H = "х";
			break;
		case "д": case "ф": 
			H = "м";
			break;
		case "р": 
			H = "ф";
			break;
		case "г": 
			H = "н";
			break;
		case "В": case "Ф": case "Б": case "П": 
			H = "ФЫ";
			break;
		case "Г": case "К": case "Х": 
			H = "К";
			break;
		case "В": case "У": case "Ж": case "Л": case "Р": 
			H = "А";
			break;
		case "С": case "Я": 
			H = "Х";
			break;
		case "Д": case "Ф": 
			H = "М";
			break;
		case "Р": 
			H = "Ф";
			break;
		case "Г": 
			H = "Н";
			break;
	}
	return H;
}

/**
 * GagEffect3 keep vowels and a some letters the same
 */
function SpeechGarble3(H) {
	switch(H) {

		// Regular characters
		case "v": case "b": case "c": case "t": 
			H = "e";
			break;
		case "q": case "k": case "x": 
			H = "k";
			break;
		case "w": case "y": case "j": case "l": case "r": 
			H = "a";
			break;
		case "s": case "z": 
			H = "s";
			break;
		case "d": 
			H = "m";
			break;
		case "p": 
			H = "f";
			break;
		case "g": 
			H = "h";
			break;
		case "a": case "e": case "i": case "o": case "u": case "m": case "n": case "h": case "f": case " ": case "!": case "?": case ".": case "~": case "-":
			break;
		case "V": case "B": case "C": case "T": 
			H = "E";
			break;
		case "Q": case "K": case "X": 
			H = "K";
			break;
		case "W": case "Y": case "J": case "L": case "R": 
			H = "A";
			break;
		case "S": case "Z": 
			H = "S";
			break;
		case "D": 
			H = "M";
			break;
		case "P": 
			H = "F";
			break;
		case "G": 
			H = "H";
			break;
		case "A": case "E": case "I": case "O": case "U": case "M": case "N": case "H": case "F": 
			break;

		// Accents/Latin characters
		case "á": case "â": case "à": 
			H = "a";
			break;
		case "é": case "ê": case "è": case "ë": 
			H = "e";
			break;
		case "í": case "î": case "ì": case "ï": 
			H = "i";
			break;
		case "ó": case "ô": case "ò": 
			H = "o";
			break;
		case "ú": case "û": case "ù": case "ü": 
			H = "u";
			break;
		case "ç": 
			H = "s";
			break;
		case "ñ": 
			H = "n";
			break;
		case "Á": case "Â": case "À": 
			H = "A";
			break;
		case "É": case "Ê": case "È": case "Ë": 
			H = "E";
			break;
		case "Í": case "Î": case "Ì": case "Ï": 
			H = "I";
			break;
		case "Ó": case "Ô": case "Ò": 
			H = "O";
			break;
		case "Ú": case "Û": case "Ù": case "Ü": 
			H = "U";
			break;
		case "Ç": 
			H = "S";
			break;
		case "Ñ": 
			H = "N";
			break;

		// Cyrillic characters
		case "в": case "ф": case "б": case "п": 
			H = "фы";
			break;
		case "г": case "к": case "х": 
			H = "к";
			break;
		case "в": case "у": case "ж": case "л": case "р": 
			H = "а";
			break;
		case "с": case "я": 
			H = "х";
			break;
		case "д": case "ф": 
			H = "м";
			break;
		case "р": 
			H = "ф";
			break;
		case "г": 
			H = "н";
			break;
		case "В": case "Ф": case "Б": case "П": 
			H = "ФЫ";
			break;
		case "Г": case "К": case "Х": 
			H = "К";
			break;
		case "В": case "У": case "Ж": case "Л": case "Р": 
			H = "А";
			break;
		case "С": case "Я": 
			H = "Х";
			break;
		case "Д": case "Ф": 
			H = "М";
			break;
		case "Р": 
			H = "Ф";
			break;
		case "Г": 
			H = "Н";
			break;
	}
	return H;
}

/**
 * GagEffect2 half of the letters stay the same
 */
function SpeechGarble2(H) {
	switch(H) {
		
		// Regular characters
		case "c": case "t": 
			H = "e";
			break;
		case "q": case "k": case "x": 
			H = "k";
			break;
		case "j": case "l": case "r": 
			H = "a";
			break;
		case "s": 
			H = "z";
			break;
		case "z": 
			H = "s";
			break;
		case "f": 
			H = "h";
			break;
		case "d": case "m": case "g": 
			H = "m";
			break;
		case "b": case "h": case "n": case "v": case "w": case "p": case "a": case "e": case "i": case "o": case "u": case "y": case " ": case "'": case "?": case "!": case ".": case ",": case "~": case "-":
			break;	
		case "C": case "T": 
			H = "E";
			break;
		case "Q": case "K": case "X": 
			H = "K";
			break;
		case "J": case "L": case "R": 
			H = "A";
			break;
		case "S": 
			H = "Z";
			break;
		case "Z": 
			H = "S";
			break;
		case "F": 
			H = "H";
			break;
		case "D": case "M": case "G": 
			H = "M";
			break;
		case "B": case "H": case "N": case "V": case "W": case "P": case "A": case "E": case "I": case "O": case "U": case "Y": 
			break;

		// Accents/Latin characters
		case "á": case "â": case "à": 
			H = "a";
			break;
		case "é": case "ê": case "è": case "ë": 
			H = "e";
			break;
		case "í": case "î": case "ì": case "ï": 
			H = "i";
			break;
		case "ó": case "ô": case "ò": 
			H = "o";
			break;
		case "ú": case "û": case "ù": case "ü": 
			H = "u";
			break;
		case "ç": 
			H = "s";
			break;
		case "ñ": 
			H = "n";
			break;
		case "á": case "â": case "à": 
			H = "a";
			break;
		case "é": case "ê": case "è": case "ë": 
			H = "e";
			break;
		case "í": case "î": case "ì": case "ï": 
			H = "i";
			break;
		case "ó": case "ô": case "ò": 
			H = "o";
			break;
		case "ú": case "û": case "ù": case "ü": 
			H = "u";
			break;
		case "ç": 
			H = "s";
			break;
		case "ñ": 
			H = "n";
			break;

		// Cyrillic characters
		case "ч": case "ц": 
			H = "е";
			break;
		case "й": case "ф": case "в": 
			H = "к";
			break;
		case "д": case "л": case "щ": case "я": 
			H = "а";
			break;
		case "з": 
			H = "с";
			break;
		case "с": 
			H = "з";
			break;
		case "д": case "ф": case "м": 
			H = "м";
			break;
		case "а": case "п": case "р": case "о": case "к": case "е": case "н": case "м": case "и": case "т": 
			break;
		case "Ч": case "Ц": 
			H = "Е";
			break;
		case "Й": case "Ф": case "В": 
			H = "К";
			break;
		case "Д": case "Л": case "Щ": case "Я": 
			H = "А";
			break;
		case "З": 
			H = "С";
			break;
		case "С": 
			H = "З";
			break;
		case "Д": case "Ф": case "М": 
			H = "М";
			break;
		case "А": case "П": case "Р": case "О": case "К": case "Е": case "Н": case "М": case "И": case "Т": 
			break;
	}
	return H;
}

/**
 * GagEffect1 most of the letters stay the same
 */
function SpeechGarble1(H) {	
	switch(H) {

		// Regular characters
		case "t": 
			H = "e";
			break;
		case "c": case "q": case "k": case "x": 
			H = "k";
			break;
		case "j": case "l": case "r": 
			H = "a";
			break;
		case "d": case "m": case "g": 
			H = "m";
			break;
		case "b": case "h": case "n": case "v": case "w": case "p": case "a": case "e": case "i": case "o": case "u": case "y": case "f": case "s": case "z": case " ": case "'": case "?": case "!": case ".": case ",": case "~": case "-":
			break;
		case "T": 
			H = "E";
			break;
		case "C": case "Q": case "K": case "X": 
			H = "K";
			break;
		case "J": case "L": case "R": 
			H = "A";
			break;
		case "D": case "M": case "G": 
			H = "M";
			break;
		case "B": case "H": case "N": case "V": case "W": case "P": case "A": case "E": case "I": case "O": case "U": case "Y": case "F": case "S": case "Z": 
			break;

		// Accents/Latin characters
		case "á": case "â": case "à": 
			H = "a";
			break;
		case "é": case "ê": case "è": case "ë": 
			H = "e";
			break;
		case "í": case "î": case "ì": case "ï": 
			H = "i";
			break;
		case "ó": case "ô": case "ò": 
			H = "o";
			break;
		case "ú": case "û": case "ù": case "ü": 
			H = "u";
			break;
		case "ç": 
			H = "s";
			break;
		case "ñ": 
			H = "n";
			break;
		case "Á": case "Â": case "À": 
			H = "A";
			break;
		case "É": case "Ê": case "È": case "Ë": 
			H = "E";
			break;
		case "Í": case "Î": case "Ì": case "Ï": 
			H = "I";
			break;
		case "Ó": case "Ô": case "Ò": 
			H = "O";
			break;
		case "Ú": case "Û": case "Ù": case "Ü": 
			H = "U";
			break;
		case "Ç": 
			H = "S";
			break;
		case "Ñ": 
			H = "N";
			break;

		// Cyrillic characters
		case "ч": case "ц": 
			H = "е";
			break;
		case "й": case "ф": case "в": 
			H = "к";
			break;
		case "д": case "л": case "щ": case "я": 
			H = "а";
			break;
		case "з": 
			H = "с";
			break;
		case "с": 
			H = "з";
			break;
		case "д": case "ф": case "м": 
			H = "м";
			break;
		case "а": case "п": case "р": case "о": case "к": case "е": case "н": case "м": case "и": case "т" : 
			break;
		case "Ч": case "Ц": 
			H = "Е";
			break;
		case "Й": case "Ф": case "В": 
			H = "К";
			break;
		case "Д": case "Л": case "Щ": case "Я": 
			H = "А";
			break;
		case "З": 
			H = "С";
			break;
		case "С": 
			H = "З";
			break;
		case "Д": case "Ф": case "М": 
			H = "М";
			break;
		case "А": case "П": case "Р": case "О": case "К": case "Е": case "Н": case "М": case "И": case "Т" : 
			break;
	}
	return H;
}

/**
 * Makes the character stutter if she has a vibrating item and/or is aroused. Stuttering based on arousal is toggled in the character's settings.
 * @param {Character} C - The character, whose dialog might need to be altered
 * @param {string} CD - The character's dialog to alter
 * @returns {string} - Returns the dialog after the stuttering factor was applied
 */
function SpeechStutter(C, CD) {

	// Validate nulls
	if (CD == null) CD = "";

	// Validates that the preferences allow stuttering
	if ((C.ArousalSettings == null) || (C.ArousalSettings.AffectStutter == null) || (C.ArousalSettings.AffectStutter != "None")) {

		// Gets the factor from current arousal
		var Factor = 0;
		if ((C.ArousalSettings == null) || (C.ArousalSettings.AffectStutter == null) || (C.ArousalSettings.AffectStutter == "Arousal") || (C.ArousalSettings.AffectStutter == "All"))
			if ((C.ArousalSettings != null) && (C.ArousalSettings.Progress != null) && (typeof C.ArousalSettings.Progress === "number") && !isNaN(C.ArousalSettings.Progress))
				Factor = Math.floor(C.ArousalSettings.Progress / 20);

		// Checks all items that "eggs" with an intensity, and replaces the factor if it's higher
		if (C.IsEgged() && ((C.ArousalSettings == null) || (C.ArousalSettings.AffectStutter == null) || (C.ArousalSettings.AffectStutter == "Vibration") || (C.ArousalSettings.AffectStutter == "All")))
			for (let A = 0; A < C.Appearance.length; A++) {
				var Item = C.Appearance[A];
				if (InventoryItemHasEffect(Item, "Egged", true) && Item.Property && Item.Property.Intensity && (typeof Item.Property.Intensity === "number") && !isNaN(Item.Property.Intensity) && (Item.Property.Intensity > Factor))
					Factor = Item.Property.Intensity;
			}

		// If the intensity factor is lower than 1, no stuttering occurs and we return the regular text
		if (Factor <= 0) return CD;

		// Loops in all letters to create a stuttering effect
		var Par = false;
		var CS = 1;
		var Seed = CD.length;
		for (let L = 0; L < CD.length; L++) {

			// Do not stutter the letters between parentheses
			var H = CD.charAt(L).toLowerCase();
			if (H == "(") Par = true;

			// If we are not between brackets and at the start of a word, there's a chance to stutter that word
			if (!Par && CS >= 0 && (H.match(/[[a-zа-яё]/i))) {

				// Generate a pseudo-random number using a seed, so that the same text always stutters the same way
				var R = Math.sin(Seed++) * 10000;
				R = R - Math.floor(R);
				R = Math.floor(R * 10) + Factor;
				if (CS == 1 || R >= 10) {
					CD = CD.substring(0, L) + CD.charAt(L) + "-" + CD.substring(L, CD.length);
					L += 2;
				}
				CS = -1;
			}
			if (H == ")") Par = false;
			if (H == " ") CS = 0;
		}
		return CD;

	}

	// No stutter effect, we return the regular text
	return CD;

}

/**
 * Makes the character talk like a Baby when she has drunk regression milk
 * @param {Character} C - The character, whose dialog needs to be altered
 * @param {string} CD - The character's dialog to alter
 * @returns {string} - Returns the dialog after baby talk was applied
 */
function SpeechBabyTalk(C, CD, BabyMessage) {
	if (CD == null) CD = "";

	var Par = false;
	var NS = "";

	if (C.Effect.indexOf("RegressedTalk") >= 0) {
		for (let L = 0; L < CD.length; L++) {
			var H = CD.charAt(L);
			if (H == "(") Par = true;
			if (!Par) {
				switch(H) {
					case "k": case "l":
						NS = NS + "w";
						break;
					case "K": case "L":
						NS = NS + "W";
						break;
					case "s":
						NS = NS + "sh";
						break;
					case "S":
						NS = NS + "Sh";
						break;
					case "t":
						NS = NS + "th";
						break;
					case "T":
						NS = NS + "Th";
						break;
					default:
						NS = NS + H;
						break;
				}
			} else NS = NS + CD.charAt(L);
			if (H == ")") Par = false;
		}
		return NS.replace(/thh/g, "th").replace(/Thh/g, "Th").replace(/shh/g, "sh").replace(/Shh/g, "Sh");
	}

	// Not drunk the milk, we return the regular text
	return CD;
}
