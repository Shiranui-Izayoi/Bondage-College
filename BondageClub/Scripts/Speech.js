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

/**
 * Processes the character's speech, anything between parentheses isn't touched. Effects alter the speech differently according to a character's language. Effects that can be applied are the following: gag talk, baby talk and stuttering.
 * @param {Character} C - The character, whose dialog might need to be altered
 * @param {string} CD - The character's dialog to alter
 * @returns {string} - Returns the dialog after speech effects were processed (Garbling, Stuttering, Baby talk)
 */
function SpeechGarble(C, CD) {

	// Variables to build the new string and check if we are in a parentheses
	var NS = "";
	var Par = false;
	if (CD == null) CD = "";
	var GagEffect = 0;
	GagEffect += SpeechGetGagLevel(C, "ItemMouth");
	GagEffect += SpeechGetGagLevel(C, "ItemMouth2");
	GagEffect += SpeechGetGagLevel(C, "ItemMouth3");
	GagEffect += SpeechGetGagLevel(C, "ItemHead");
	GagEffect += SpeechGetGagLevel(C, "ItemHood");
	GagEffect += SpeechGetGagLevel(C, "ItemNeck");
	GagEffect += SpeechGetGagLevel(C, "ItemDevices");
	GagEffect += SpeechGetGagLevel(C, "ItemHoodAddon");

	// GagTotal4 always returns mmmmm and muffles some frequent letters entirely, 75% least frequent letters
	if (GagEffect >= 20  || ((C.ID != 0) && (Player.GetDeafLevel() >= 7))) {
		for (let L = 0; L < CD.length; L++) {
			var H = CD.charAt(L).toLowerCase();
			if (H == "(") Par = true;
			if (Par) NS = NS + CD.charAt(L);
			else {
				switch(H) {
					case " ": case ".": case "?": case "!": case "~": case "-": 
						NS = NS + H;
						break;
					case "z": case "q": case "j": case "x": case "k": case "v": case "b": case "y": case "w": case "g": case "p": case "f": case "u": case "c": case "d": case "l": case "h": case "r": 
						NS = NS + " ";
						break;
					default: 
						NS = NS + "m";
						break;
				}
			}

			if (H == ")") Par = false;
		}
		NS = SpeechStutter(C, NS);
		NS = SpeechBabyTalk(C, NS);
		return NS;
	}

	// GagTotal3 always returns mmmmm and muffles some relatively frequent letters entirely, 50% least frequent letters
	if (GagEffect >= 16  || ((C.ID != 0) && (Player.GetDeafLevel() >= 6))) {
		for (let L = 0; L < CD.length; L++) {
			var H = CD.charAt(L).toLowerCase();
			if (H == "(") Par = true;
			if (Par) NS = NS + CD.charAt(L);
			else {
				switch(H) {
					case " ": case ".": case "?": case "!": case "~": case "-": 
						NS = NS + H;
						break;
					case "z": case "q": case "j": case "x": case "k": case "v": case "b": case "y": case "w": case "g": case "p": case "f": 
						NS = NS + " ";
						break;
					default: 
						NS = NS + "m";
						break;
				}
			}

			if (H == ")") Par = false;
		}
		NS = SpeechStutter(C, NS);
		NS = SpeechBabyTalk(C, NS);
		return NS;
	}

	// GagTotal2 always returns mmmmm and muffles some less frequent letters entirely; 25% least frequent letters
	if (GagEffect >= 12  || ((C.ID != 0) && (Player.GetDeafLevel() >= 5))) {
		for (let L = 0; L < CD.length; L++) {
			var H = CD.charAt(L).toLowerCase();
			if (H == "(") Par = true;
			if (Par) NS = NS + CD.charAt(L);
			else {
				switch(H) {
					case " ": case ".": case "?": case "!": case "~": case "-": 
						NS = NS + H;
						break;
					case "z": case "q": case "j": case "x": case "k": case "v": 
						NS = NS + " ";
						break;
					default: 
						NS = NS + "m";
						break;
				}
			}

			if (H == ")") Par = false;
		}
		NS = SpeechStutter(C, NS);
		NS = SpeechBabyTalk(C, NS);
		return NS;
	}	

	// Total gags always returns mmmmm
	if ((GagEffect >= 8) || ((C.ID != 0) && (Player.GetDeafLevel() >= 4))) {
		for (let L = 0; L < CD.length; L++) {
			var H = CD.charAt(L).toLowerCase();
			if (H == "(") Par = true;
			if (Par) NS = NS + CD.charAt(L);
			else {
				switch(H) {
					case " ": case ".": case "?": case "!": case "~": case "-": 
						NS = NS + H;
						break;
					default: 
						NS = NS + "m";
						break;
				}
			}

			if (H == ")") Par = false;
		}
		NS = SpeechStutter(C, NS);
		NS = SpeechBabyTalk(C, NS);
		return NS;
	}

	// VeryHeavy garble - Close to no letter stays the same
	if (GagEffect >= 7) {
		for (let L = 0; L < CD.length; L++) {
			var H = CD.charAt(L);
			if (H == "(") Par = true;
			if (!Par) {
				switch(H) {

					// Regular characters
					case "a": case "e": case "i": case "o": case "u": case "y": 
						NS = NS + "e";
						break;
					case "j": case "k": case "l": case "r": 
						NS = NS + "a";
						break;
					case "s": case "z": case "h": 
						NS = NS + "h";
						break;
					case "d": case "f": case "g": case "n": case "m": case "w": case "t": case "c": case "q": case "x": case "p": case "v": 
						NS = NS + "m";
						break;
					case " ": case ".": case "?": case "!": case "~": case "-": case "b": 
						NS = NS + H;
						break;
					case "A": case "E": case "I": case "O": case "U": case "Y": 
						NS = NS + "E";
						break;
					case "J": case "K": case "L": case "R": 
						NS = NS + "A";
						break;
					case "S": case "Z": case "H": 
						NS = NS + "H";
						break;
					case "D": case "F": case "G": case "N": case "M": case "W": case "T": case "C": case "Q": case "X": case "P": case "V": 
						NS = NS + "M";
						break;
					case "B":
						NS = NS + H;
						break;

					// Accents/Latin characters
					case "á": case "â": case "à": case "é": case "ê": case "è": case "ë": case "í": case "î": case "ì": case "ï": case "ó": case "ô": case "ò": case "ú": case "û": case "ù": case "ü": 
						NS = NS + "e";
						break;
					case "ç": 
						NS = NS + "h";
						break;
					case "ñ": 
						NS = NS + "m";
						break;
					case "Á": case "Â": case "À": case "É": case "Ê": case "È": case "Ë": case "Í": case "Î": case "Ì": case "Ï": case "Ó": case "Ô": case "Ò": case "Ú": case "Û": case "Ù": case "Ü": 
						NS = NS + "E";
						break;
					case "Ç": 
						NS = NS + "H";
						break;
					case "Ñ": 
						NS = NS + "M";
						break;

					// Cyrillic characters
					case "а": case "е": case "и": case "о": case "у": case "ю": case "л": case "я": 
						NS = NS + "е";
						break;
					case "с": case "й": case "х": 
						NS = NS + "к";
						break;
					case "ж": case "к": case "л": case "р": case "у": 
						NS = NS + "а";
						break;
					case "з": case "с": case "г": case "й": 
						NS = NS + "г";
						break;
					case "б": case "р": case "в": case "ы": 
						NS = NS + "ф";
						break;
					case "д": case "ф": case "г": case "н": case "м": 
						NS = NS + "м";
						break;
					case "А": case "Е": case "И": case "О": case "У": case "Ю": case "Л": case "Я": 
						NS = NS + "Е";
						break;
					case "С": case "Й": case "Х": 
						NS = NS + "К";
						break;
					case "Ж": case "К": case "Л": case "Р": case "У": 
						NS = NS + "А";
						break;
					case "З": case "С": case "Г": case "Й": 
						NS = NS + "Г";
						break;
					case "Б": case "Р": case "В": case "Ы": 
						NS = NS + "Ф";
						break;
					case "Д": case "Ф": case "Г": case "Н": case "М": 
						NS = NS + "М";
						break;
				}

			} else NS = NS + CD.charAt(L);
			if (H == ")") Par = false;
		}
		NS = SpeechStutter(C, NS);
		NS = SpeechBabyTalk(C, NS);
		return NS;
	}
	
	// Heavy garble - Almost no letter stays the same
	if ((GagEffect >= 6) || ((C.ID != 0) && (Player.GetDeafLevel() >= 3))) {
		for (let L = 0; L < CD.length; L++) {
			var H = CD.charAt(L);
			if (H == "(") Par = true;
			if (!Par) {
				switch(H) {

					// Regular characters
					case "a": case "e": case "i": case "o": case "u": case "y": case "t": 
						NS = NS + "e";
						break;
					case "c": case "q": case "x": 
						NS = NS + "k";
						break;
					case "j": case "k": case "l": case "r": case "w": 
						NS = NS + "a";
						break;
					case "s": case "z": case "h": 
						NS = NS + "h";
						break;
					case "b": case "p": case "v": 
						NS = NS + "f";
						break;
					case "d": case "f": case "g": case "n": case "m": 
						NS = NS + "m";
						break;
					case " ": case ".": case "?": case "!": case "~": case "-": 
						NS = NS + H;
						break;
					case "A": case "E": case "I": case "O": case "U": case "Y": case "T": 
						NS = NS + "E";
						break;
					case "C": case "Q": case "X": 
						NS = NS + "K";
						break;
					case "J": case "K": case "L": case "R": case "W": 
						NS = NS + "A";
						break;
					case "S": case "Z": case "H": 
						NS = NS + "H";
						break;
					case "B": case "P": case "V": 
						NS = NS + "F";
						break;
					case "D": case "F": case "G": case "N": case "M": 
						NS = NS + "M";
						break;

					// Accents/Latin characters
					case "á": case "â": case "à": case "é": case "ê": case "è": case "ë": case "í": case "î": case "ì": case "ï": case "ó": case "ô": case "ò": case "ú": case "û": case "ù": case "ü": 
						NS = NS + "e";
						break;
					case "ç": 
						NS = NS + "h";
						break;
					case "ñ": 
						NS = NS + "m";
						break;
					case "Á": case "Â": case "À": case "É": case "Ê": case "È": case "Ë": case "Í": case "Î": case "Ì": case "Ï": case "Ó": case "Ô": case "Ò": case "Ú": case "Û": case "Ù": case "Ü": 
						NS = NS + "E";
						break;
					case "Ç": 
						NS = NS + "H";
						break;
					case "Ñ": 
						NS = NS + "M";
						break;

					// Cyrillic characters
					case "а": case "е": case "и": case "о": case "у": case "ю": case "л": case "я": 
						NS = NS + "е";
						break;
					case "с": case "й": case "х": 
						NS = NS + "к";
						break;
					case "ж": case "к": case "л": case "р": case "у": 
						NS = NS + "а";
						break;
					case "з": case "с": case "г": case "й": 
						NS = NS + "г";
						break;
					case "б": case "р": case "в": case "ы": 
						NS = NS + "ф";
						break;
					case "д": case "ф": case "г": case "н": case "м": 
						NS = NS + "м";
						break;
					case "А": case "Е": case "И": case "О": case "У": case "Ю": case "Л": case "Я": 
						NS = NS + "Е";
						break;
					case "С": case "Й": case "Х": 
						NS = NS + "К";
						break;
					case "Ж": case "К": case "Л": case "Р": case "У": 
						NS = NS + "А";
						break;
					case "З": case "С": case "Г": case "Й": 
						NS = NS + "Г";
						break;
					case "Б": case "Р": case "В": case "Ы": 
						NS = NS + "Ф";
						break;
					case "Д": case "Ф": case "Г": case "Н": case "М": 
						NS = NS + "М";
						break;
				}

			} else NS = NS + CD.charAt(L);
			if (H == ")") Par = false;
		}
		NS = SpeechStutter(C, NS);
		NS = SpeechBabyTalk(C, NS);
		return NS;
	}

	// Medium garble - Some letters stays the same
	if (GagEffect >= 5) {
		for (let L = 0; L < CD.length; L++) {
			var H = CD.charAt(L);
			if (H == "(") Par = true;
			if (!Par) {
				switch(H) {

					// Regular characters
					case "e": case "i": case "o": case "u": case "y": case "t": 
						NS = NS + "e";
						break;
					case "c": case "q": case "x": case "k": 
						NS = NS + "k";
						break;
					case "j": case "l": case "r": case "w": case "a": 
						NS = NS + "a";
						break;
					case "s": case "z": case "h": 
						NS = NS + "h";
						break;
					case "b": case "p": case "v": 
						NS = NS + "f";
						break;
					case "d": case "f": case "g": case "m": 
						NS = NS + "m";
						break;
					case "n": case " ": case ".": case "?": case "!": case "~": case "-":
						NS = NS + H;
						break;
					case "E": case "I": case "O": case "U": case "Y": case "T": 
						NS = NS + "E";
						break;
					case "C": case "Q": case "X": case "K": 
						NS = NS + "K";
						break;
					case "J": case "L": case "R": case "W": case "A": 
						NS = NS + "A";
						break;
					case "S": case "Z": case "H": 
						NS = NS + "H";
						break;
					case "B": case "P": case "V": 
						NS = NS + "F";
						break;
					case "D": case "F": case "G": case "M": 
						NS = NS + "M";
						break;
					case "N": 
						NS = NS + H;
						break;

					// Accents/Latin characters
					case "á": case "â": case "à": case "é": case "ê": case "è": case "ë": case "í": case "î": case "ì": case "ï": case "ó": case "ô": case "ò": case "ú": case "û": case "ù": case "ü": 
						NS = NS + "e";
						break;
					case "ç": 
						NS = NS + "h";
						break;
					case "ñ": 
						NS = NS + "m";
						break;
					case "Á": case "Â": case "À": case "É": case "Ê": case "È": case "Ë": case "Í": case "Î": case "Ì": case "Ï": case "Ó": case "Ô": case "Ò": case "Ú": case "Û": case "Ù": case "Ü": 
						NS = NS + "E";
						break;
					case "Ç": 
						NS = NS + "H";
						break;
					case "Ñ": 
						NS = NS + "M";
						break;

					// Cyrillic characters
					case "а": case "е": case "и": case "о": case "у": case "ю": case "л": case "я": 
						NS = NS + "е";
						break;
					case "с": case "й": case "х": 
						NS = NS + "к";
						break;
					case "ж": case "к": case "л": case "р": case "у": 
						NS = NS + "а";
						break;
					case "з": case "с": case "г": case "й": 
						NS = NS + "г";
						break;
					case "б": case "р": case "в": case "ы": 
						NS = NS + "ф";
						break;
					case "д": case "ф": case "г": case "н": case "м": 
						NS = NS + "м";
						break;
					case "А": case "Е": case "И": case "О": case "У": case "Ю": case "Л": case "Я": 
						NS = NS + "Е";
						break;
					case "С": case "Й": case "Х": 
						NS = NS + "К";
						break;
					case "Ж": case "К": case "Л": case "Р": case "У": 
						NS = NS + "А";
						break;
					case "З": case "С": case "Г": case "Й": 
						NS = NS + "Г";
						break;
					case "Б": case "Р": case "В": case "Ы": 
						NS = NS + "Ф";
						break;
					case "Д": case "Ф": case "Г": case "Н": case "М": 
						NS = NS + "М";
						break;
				}

			} else NS = NS + CD.charAt(L);
			if (H == ")") Par = false;
		}
		NS = SpeechStutter(C, NS);
		NS = SpeechBabyTalk(C, NS);
		return NS;
	}
	
	// Normal garble, keep vowels and a few letters the same
	if ((GagEffect >= 4) || ((C.ID != 0) && (Player.GetDeafLevel() >= 2))) {
		for (let L = 0; L < CD.length; L++) {
			var H = CD.charAt(L);
			if (H == "(") Par = true;
			if (!Par) {
				switch(H) {

					// Regular characters
					case "v": case "b": case "c": case "t": 
						NS = NS + "e";
						break;
					case "q": case "k": case "x": 
						NS = NS + "k";
						break;
					case "w": case "y": case "j": case "l": case "r": 
						NS = NS + "a";
						break;
					case "s": case "z": 
						NS = NS + "h";
						break;
					case "d": case "f": 
						NS = NS + "m";
						break;
					case "p": 
						NS = NS + "f";
						break;
					case "g": 
						NS = NS + "n";
						break;
					case "a": case "e": case "i": case "o": case "u": case "m": case "n": case "h": case " ": case "!": case "?": case ".": case "~": case "-":
						NS = NS + H;
						break;
					case "V": case "B": case "C": case "T": 
						NS = NS + "E";
						break;
					case "Q": case "K": case "X": 
						NS = NS + "K";
						break;
					case "W": case "Y": case "J": case "L": case "R": 
						NS = NS + "A";
						break;
					case "S": case "Z": 
						NS = NS + "H";
						break;
					case "D": case "F": 
						NS = NS + "M";
						break;
					case "P": 
						NS = NS + "F";
						break;
					case "G": 
						NS = NS + "N";
						break;
					case "A": case "E": case "I": case "O": case "U": case "M": case "N": case "H": 
						NS = NS + H;
						break;

					// Accents/Latin characters
					case "á": case "â": case "à": 
						NS = NS + "a";
						break;
					case "é": case "ê": case "è": case "ë": 
						NS = NS + "e";
						break;
					case "í": case "î": case "ì": case "ï": 
						NS = NS + "i";
						break;
					case "ó": case "ô": case "ò": 
						NS = NS + "o";
						break;
					case "ú": case "û": case "ù": case "ü": 
						NS = NS + "u";
						break;
					case "ç": 
						NS = NS + "s";
						break;
					case "ñ": 
						NS = NS + "n";
						break;
					case "Á": case "Â": case "À": 
						NS = NS + "A";
						break;
					case "É": case "Ê": case "È": case "Ë": 
						NS = NS + "E";
						break;
					case "Í": case "Î": case "Ì": case "Ï": 
						NS = NS + "I";
						break;
					case "Ó": case "Ô": case "Ò": 
						NS = NS + "O";
						break;
					case "Ú": case "Û": case "Ù": case "Ü": 
						NS = NS + "U";
						break;
					case "Ç": 
						NS = NS + "S";
						break;
					case "Ñ": 
						NS = NS + "N";
						break;

					// Cyrillic characters
					case "в": case "ф": case "б": case "п": 
						NS = NS + "фы";
						break;
					case "г": case "к": case "х": 
						NS = NS + "к";
						break;
					case "в": case "у": case "ж": case "л": case "р": 
						NS = NS + "а";
						break;
					case "с": case "я": 
						NS = NS + "х";
						break;
					case "д": case "ф": 
						NS = NS + "м";
						break;
					case "р": 
						NS = NS + "ф";
						break;
					case "г": 
						NS = NS + "н";
						break;
					case "В": case "Ф": case "Б": case "П": 
						NS = NS + "ФЫ";
						break;
					case "Г": case "К": case "Х": 
						NS = NS + "К";
						break;
					case "В": case "У": case "Ж": case "Л": case "Р": 
						NS = NS + "А";
						break;
					case "С": case "Я": 
						NS = NS + "Х";
						break;
					case "Д": case "Ф": 
						NS = NS + "М";
						break;
					case "Р": 
						NS = NS + "Ф";
						break;
					case "Г": 
						NS = NS + "Н";
						break;
				}

			} else NS = NS + CD.charAt(L);
			if (H == ")") Par = false;
		}
		NS = SpeechStutter(C, NS);
		NS = SpeechBabyTalk(C, NS);
		return NS;
	}

	// Easy garble, keep vowels and a some letters the same
	if (GagEffect >= 3) {
		for (let L = 0; L < CD.length; L++) {
			var H = CD.charAt(L);
			if (H == "(") Par = true;
			if (!Par) {
				switch(H) {

					// Regular characters
					case "v": case "b": case "c": case "t": 
						NS = NS + "e";
						break;
					case "q": case "k": case "x": 
						NS = NS + "k";
						break;
					case "w": case "y": case "j": case "l": case "r": 
						NS = NS + "a";
						break;
					case "s": case "z": 
						NS = NS + "s";
						break;
					case "d": 
						NS = NS + "m";
						break;
					case "p": 
						NS = NS + "f";
						break;
					case "g": 
						NS = NS + "h";
						break;
					case "a": case "e": case "i": case "o": case "u": case "m": case "n": case "h": case "f": case " ": case "!": case "?": case ".": case "~": case "-":
						NS = NS + H;
						break;
					case "V": case "B": case "C": case "T": 
						NS = NS + "E";
						break;
					case "Q": case "K": case "X": 
						NS = NS + "K";
						break;
					case "W": case "Y": case "J": case "L": case "R": 
						NS = NS + "A";
						break;
					case "S": case "Z": 
						NS = NS + "S";
						break;
					case "D": 
						NS = NS + "M";
						break;
					case "P": 
						NS = NS + "F";
						break;
					case "G": 
						NS = NS + "H";
						break;
					case "A": case "E": case "I": case "O": case "U": case "M": case "N": case "H": case "F": 
						NS = NS + H;
						break;

					// Accents/Latin characters
					case "á": case "â": case "à": 
						NS = NS + "a";
						break;
					case "é": case "ê": case "è": case "ë": 
						NS = NS + "e";
						break;
					case "í": case "î": case "ì": case "ï": 
						NS = NS + "i";
						break;
					case "ó": case "ô": case "ò": 
						NS = NS + "o";
						break;
					case "ú": case "û": case "ù": case "ü": 
						NS = NS + "u";
						break;
					case "ç": 
						NS = NS + "s";
						break;
					case "ñ": 
						NS = NS + "n";
						break;
					case "Á": case "Â": case "À": 
						NS = NS + "A";
						break;
					case "É": case "Ê": case "È": case "Ë": 
						NS = NS + "E";
						break;
					case "Í": case "Î": case "Ì": case "Ï": 
						NS = NS + "I";
						break;
					case "Ó": case "Ô": case "Ò": 
						NS = NS + "O";
						break;
					case "Ú": case "Û": case "Ù": case "Ü": 
						NS = NS + "U";
						break;
					case "Ç": 
						NS = NS + "S";
						break;
					case "Ñ": 
						NS = NS + "N";
						break;

					// Cyrillic characters
					case "в": case "ф": case "б": case "п": 
						NS = NS + "фы";
						break;
					case "г": case "к": case "х": 
						NS = NS + "к";
						break;
					case "в": case "у": case "ж": case "л": case "р": 
						NS = NS + "а";
						break;
					case "с": case "я": 
						NS = NS + "х";
						break;
					case "д": case "ф": 
						NS = NS + "м";
						break;
					case "р": 
						NS = NS + "ф";
						break;
					case "г": 
						NS = NS + "н";
						break;
					case "В": case "Ф": case "Б": case "П": 
						NS = NS + "ФЫ";
						break;
					case "Г": case "К": case "Х": 
						NS = NS + "К";
						break;
					case "В": case "У": case "Ж": case "Л": case "Р": 
						NS = NS + "А";
						break;
					case "С": case "Я": 
						NS = NS + "Х";
						break;
					case "Д": case "Ф": 
						NS = NS + "М";
						break;
					case "Р": 
						NS = NS + "Ф";
						break;
					case "Г": 
						NS = NS + "Н";
						break;
				}

			} else NS = NS + CD.charAt(L);
			if (H == ")") Par = false;
		}
		NS = SpeechStutter(C, NS);
		NS = SpeechBabyTalk(C, NS);
		return NS;
	}
	
	// Light garble, half of the letters stay the same
	if ((GagEffect >= 2) || ((C.ID != 0) && (Player.GetDeafLevel() >= 1))) {
		for (let L = 0; L < CD.length; L++) {
			var H = CD.charAt(L);
			if (H == "(") Par = true;
			if (!Par) {
				switch(H) {

					// Regular characters
					case "c": case "t": 
						NS = NS + "e";
						break;
					case "q": case "k": case "x": 
						NS = NS + "k";
						break;
					case "j": case "l": case "r": 
						NS = NS + "a";
						break;
					case "s": 
						NS = NS + "z";
						break;
					case "z": 
						NS = NS + "s";
						break;
					case "f": 
						NS = NS + "h";
						break;
					case "d": case "m": case "g": 
						NS = NS + "m";
						break;
					case "b": case "h": case "n": case "v": case "w": case "p": case "a": case "e": case "i": case "o": case "u": case "y": case " ": case "'": case "?": case "!": case ".": case ",": case "~": case "-":
						NS = NS + H;
						break;	
					case "C": case "T": 
						NS = NS + "E";
						break;
					case "Q": case "K": case "X": 
						NS = NS + "K";
						break;
					case "J": case "L": case "R": 
						NS = NS + "A";
						break;
					case "S": 
						NS = NS + "Z";
						break;
					case "Z": 
						NS = NS + "S";
						break;
					case "F": 
						NS = NS + "H";
						break;
					case "D": case "M": case "G": 
						NS = NS + "M";
						break;
					case "B": case "H": case "N": case "V": case "W": case "P": case "A": case "E": case "I": case "O": case "U": case "Y": 
						NS = NS + H;
						break;

					// Accents/Latin characters
					case "á": case "â": case "à": 
						NS = NS + "a";
						break;
					case "é": case "ê": case "è": case "ë": 
						NS = NS + "e";
						break;
					case "í": case "î": case "ì": case "ï": 
						NS = NS + "i";
						break;
					case "ó": case "ô": case "ò": 
						NS = NS + "o";
						break;
					case "ú": case "û": case "ù": case "ü": 
						NS = NS + "u";
						break;
					case "ç": 
						NS = NS + "s";
						break;
					case "ñ": 
						NS = NS + "n";
						break;
					case "á": case "â": case "à": 
						NS = NS + "a";
						break;
					case "é": case "ê": case "è": case "ë": 
						NS = NS + "e";
						break;
					case "í": case "î": case "ì": case "ï": 
						NS = NS + "i";
						break;
					case "ó": case "ô": case "ò": 
						NS = NS + "o";
						break;
					case "ú": case "û": case "ù": case "ü": 
						NS = NS + "u";
						break;
					case "ç": 
						NS = NS + "s";
						break;
					case "ñ": 
						NS = NS + "n";
						break;

					// Cyrillic characters
					case "ч": case "ц": 
						NS = NS + "е";
						break;
					case "й": case "ф": case "в": 
						NS = NS + "к";
						break;
					case "д": case "л": case "щ": case "я": 
						NS = NS + "а";
						break;
					case "з": 
						NS = NS + "с";
						break;
					case "с": 
						NS = NS + "з";
						break;
					case "д": case "ф": case "м": case "г": 
						NS = NS + "м";
						break;
					case "а": case "п": case "р": case "о": case "к": case "е": case "н": case "м": case "и": case "т": 
						NS = NS + H;
						break;
					case "Ч": case "Ц": 
						NS = NS + "Е";
						break;
					case "Й": case "Ф": case "В": 
						NS = NS + "К";
						break;
					case "Д": case "Л": case "Щ": case "Я": 
						NS = NS + "А";
						break;
					case "З": 
						NS = NS + "С";
						break;
					case "С": 
						NS = NS + "З";
						break;
					case "Д": case "Ф": case "М": case "Г": 
						NS = NS + "М";
						break;
					case "А": case "П": case "Р": case "О": case "К": case "Е": case "Н": case "М": case "И": case "Т": 
						NS = NS + H;
						break;
				}

			} else NS = NS + CD.charAt(L);
			if (H == ")") Par = false;
		}
		NS = SpeechStutter(C, NS);
		NS = SpeechBabyTalk(C, NS);
		return NS;
	}
	
	// Very Light garble, most of the letters stay the same
	if (GagEffect >= 1) {
		for (let L = 0; L < CD.length; L++) {
			var H = CD.charAt(L);
			if (H == "(") Par = true;
			if (!Par) {
				switch(H) {

					// Regular characters
					case "t": 
						NS = NS + "e";
						break;
					case "c": case "q": case "k": case "x": 
						NS = NS + "k";
						break;
					case "j": case "l": case "r": 
						NS = NS + "a";
						break;
					case "d": case "m": case "g": 
						NS = NS + "m";
						break;
					case "b": case "h": case "n": case "v": case "w": case "p": case "a": case "e": case "i": case "o": case "u": case "y": case "f": case "s": case "z": case " ": case "'": case "?": case "!": case ".": case ",": case "~": case "-":
						NS = NS + H;
						break;
					case "T": 
						NS = NS + "E";
						break;
					case "C": case "Q": case "K": case "X": 
						NS = NS + "K";
						break;
					case "J": case "L": case "R": 
						NS = NS + "A";
						break;
					case "D": case "M": case "G": 
						NS = NS + "M";
						break;
					case "B": case "H": case "N": case "V": case "W": case "P": case "A": case "E": case "I": case "O": case "U": case "Y": case "F": case "S": case "Z": 
						NS = NS + H;
						break;

					// Accents/Latin characters
					case "á": case "â": case "à": 
						NS = NS + "a";
						break;
					case "é": case "ê": case "è": case "ë": 
						NS = NS + "e";
						break;
					case "í": case "î": case "ì": case "ï": 
						NS = NS + "i";
						break;
					case "ó": case "ô": case "ò": 
						NS = NS + "o";
						break;
					case "ú": case "û": case "ù": case "ü": 
						NS = NS + "u";
						break;
					case "ç": 
						NS = NS + "s";
						break;
					case "ñ": 
						NS = NS + "n";
						break;
					case "Á": case "Â": case "À": 
						NS = NS + "A";
						break;
					case "É": case "Ê": case "È": case "Ë": 
						NS = NS + "E";
						break;
					case "Í": case "Î": case "Ì": case "Ï": 
						NS = NS + "I";
						break;
					case "Ó": case "Ô": case "Ò": 
						NS = NS + "O";
						break;
					case "Ú": case "Û": case "Ù": case "Ü": 
						NS = NS + "U";
						break;
					case "Ç": 
						NS = NS + "S";
						break;
					case "Ñ": 
						NS = NS + "N";
						break;

					// Cyrillic characters
					case "ч": case "ц": 
						NS = NS + "е";
						break;
					case "й": case "ф": case "в": 
						NS = NS + "к";
						break;
					case "д": case "л": case "щ": case "я": 
						NS = NS + "а";
						break;
					case "з": 
						NS = NS + "с";
						break;
					case "с": 
						NS = NS + "з";
						break;
					case "д": case "ф": case "м": case "г": 
						NS = NS + "м";
						break;
					case "а": case "п": case "р": case "о": case "к": case "е": case "н": case "м": case "и": case "т" : 
						NS = NS + H;
						break;
					case "Ч": case "Ц": 
						NS = NS + "Е";
						break;
					case "Й": case "Ф": case "В": 
						NS = NS + "К";
						break;
					case "Д": case "Л": case "Щ": case "Я": 
						NS = NS + "А";
						break;
					case "З": 
						NS = NS + "С";
						break;
					case "С": 
						NS = NS + "З";
						break;
					case "Д": case "Ф": case "М": case "Г": 
						NS = NS + "М";
						break;
					case "А": case "П": case "Р": case "О": case "К": case "Е": case "Н": case "М": case "И": case "Т" : 
						NS = NS + H;
						break;
				}

			} else NS = NS + CD.charAt(L);
			if (H == ")") Par = false;
		}
		NS = SpeechStutter(C, NS);
		NS = SpeechBabyTalk(C, NS);
		return NS;
	}

	// No gag effect, we return the regular text
	CD = SpeechStutter(C, CD);
	CD = SpeechBabyTalk(C, CD);
	return CD;

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
function SpeechBabyTalk(C, CD) {
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
		}
		return NS.replace(/thh/g, "th").replace(/Thh/g, "Th").replace(/shh/g, "sh").replace(/Shh/g, "Sh");
	}

	// Not drunk the milk, we return the regular text
	return CD;
}
