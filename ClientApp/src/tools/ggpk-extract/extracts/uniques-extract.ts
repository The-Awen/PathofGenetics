import * as fs from "fs";
import { JSDOM } from "jsdom";
import * as Immutable from "immutable";

let emptyItem = {
	name: "",
	itemClass: "",
	baseTypeName: "",
	requirements: {},
	properties: {},
	implicitMods: [],
	explicitMods: []
};

export function extractUniques(baseTypes: any[], uniqueItemUrls: string[], allDescriptions: any[]): Promise<Immutable.Iterable<number, any>> {
	allDescriptions.forEach(d => d.descriptions.forEach(desc => desc.templatedText = parseMod(desc.text).text));
	let uniqueItemLists = Promise.all(uniqueItemUrls.map(url => JSDOM.fromURL(url).then(dom => parsePage(dom, allDescriptions, baseTypes))));
	return uniqueItemLists.then(lists => lists.reduce((x, y) => x.concat(y)));
}

function parsePage(dom: JSDOM, allDescriptions: any[], baseTypes: any[]): Immutable.Iterable<number, any> {
	let rows = toList(dom.window.document.querySelectorAll("table.item-table")).flatMap(t => toList(t.querySelectorAll("tr")).skip(1));

	return rows.map(uniqueItemRow => {
		let uniqueItem = JSON.parse(JSON.stringify(emptyItem));
		let header = uniqueItemRow.querySelector("td .item-box .header").innerHTML.split("<br>");
		let baseItemType = baseTypes.find(t => t.name === header[1]);

		if (!baseItemType) return null;

		uniqueItem.name = header[0];
		uniqueItem.baseTypeName = header[1].trim();
		uniqueItem.itemClass = baseItemType.itemClass;

		let groups = toList(uniqueItemRow.querySelectorAll(".item-stats .group"));
		let nonModGroups = groups.filter(g => toList(g.classList).count() === 1);
		let modGroups = groups.filter(g => toList(g.classList).contains("-mod"));

		if (nonModGroups.count() === 1 && uniqueItem.baseTypeName.indexOf("Jewel") !== -1) {
			uniqueItem.properties = parseProperties(toList(nonModGroups.first().querySelectorAll(".tc.-default")));
		}
		else if (nonModGroups.count() === 1) {
			uniqueItem.requirements = parseRequirements(toList(nonModGroups.last().querySelectorAll(".tc.-default")));
		}
		else if (nonModGroups.count() === 2) {
			uniqueItem.properties = parseProperties(toList(nonModGroups.first().querySelectorAll(".tc.-default")));
			uniqueItem.requirements = parseRequirements(toList(nonModGroups.last().querySelectorAll(".tc.-default")));
		}

		let modHtml = uniqueItemRow.querySelector("td:last-of-type.-mod");
		let explicitModsElement = <Element>JSDOM.fragment("<div></div>").firstChild;
		let implicitModsElement = <Element>JSDOM.fragment("<div></div>").firstChild;
		let hasImplicits = toList(modHtml.childNodes).some(n => n["classList"] && n["classList"].contains("item-stat-separator"));

		if (hasImplicits) {
			let isDivider = (n: Node) => n["classList"] && n["classList"].contains("item-stat-separator") ? false : true;
			toList(modHtml.childNodes).takeWhile(n => isDivider(n)).forEach(n => implicitModsElement.appendChild(n));
			toList(modHtml.childNodes).skipWhile(n => isDivider(n)).forEach(n => explicitModsElement.appendChild(n));
		}
		else {
			toList(modHtml.childNodes).forEach(n => explicitModsElement.appendChild(n));
		}

		uniqueItem.implicitMods = parseModList(implicitModsElement, allDescriptions);
		uniqueItem.explicitMods = parseModList(explicitModsElement, allDescriptions);
		return uniqueItem;
	}).filter(i => i !== null);
}

function parseRequirements(elements: Immutable.List<Element>): any {
	let result = {};

	elements.forEach(p => {
		let requirements = p.textContent.replace("Requires", "").split(",");

		requirements.forEach(req => {
			req = req.trim();
			if (req.startsWith("Level")) result["level"] = parseInt(req.replace("Level ", ""));
			else if (req.endsWith("Str")) result["str"] = parseInt(req.replace(" Str", ""));
			else if (req.endsWith("Dex")) result["dex"] = parseInt(req.replace(" Dex", ""));
			else if (req.endsWith("Int")) result["int"] = parseInt(req.replace(" Int", ""));
		});
	});

	return result;
}

function parseProperties(elements: Immutable.List<Element>): any {
	let result = {};

	elements.forEach(p => {
		let property = p.textContent.split(":");

		if (property.length === 2) {
			let propertyName = property[0].trim();
			propertyName = propertyName[0].toLowerCase() + propertyName.substr(1);
			propertyName = propertyName.replace(/\s/g, "");
			if (propertyName === "quality") return;
			let propertyValue = parseMod(property[1].trim()).values[0];
			result[propertyName] = typeof propertyValue === "number" ? propertyValue : propertyValue.min.value;
		}
		else if (p.textContent.startsWith("Consumes")) result["flaskConsumedCharges"] = parseMod(p.textContent.trim())
		else if (p.textContent.startsWith("Lasts")) result["flaskDuration"] = parseMod(p.textContent.trim());
	});

	return result;
}

function parseModList(rootElement: Element, allDescriptions: any[]): any[] {
	if (!rootElement.childNodes.length) return [];

	let lines = rootElement.innerHTML.split("<br>")
		.map(m => JSDOM.fragment(m).textContent)
		.map(m => m.replace("within the Radius", "in Radius"))
		.filter(m => m.indexOf("(Hidden)") === -1 && m !== "Corrupted");

	let parsedMods = [];

	for (let i = 0; i < lines.length; i++) {
		let matchingMod = findMod(lines[i], allDescriptions);

		if (!matchingMod.length && i + 1 < lines.length) {
			matchingMod = findMod(lines[i] + " " + lines[i + 1], allDescriptions);
			if (matchingMod.length) i++;
		}

		if (!matchingMod.length) console.log("Unknown mod: " + lines[i])
		parsedMods.push(matchingMod)
	}

	return parsedMods;
}

function findMod(modText: string, allDescriptions: any[]): any {
	let parsedMod = parseMod(modText);
	let matchingStat = allDescriptions.find(d => d.descriptions.some(desc => desc.templatedText.toLowerCase() === parsedMod.text.toLowerCase()));

	if (!matchingStat) {
		return [];
	}

	let matchingDesc = matchingStat.descriptions.find(desc => desc.templatedText.toLowerCase() === parsedMod.text.toLowerCase());
	let fixedNumbers = findNumbersInDescription(matchingDesc.text);
	let numRemovedValues = 0;
	fixedNumbers.forEach((n, i) => { if (n) parsedMod.values.splice(i + numRemovedValues++, 1); });

	if (!parsedMod.values.length) parsedMod.values.push(0);

	return parsedMod.values.map((v, i) => {
		let min = typeof v === "number" ? v : v.min.value;
		let max = typeof v === "number" ? v : v.max.value;
		return { "id": matchingStat.identifiers[i], "min": min, "max": max };
	});
}

function findNumbersInDescription(desc: string): boolean[] {
	let currentIndex = 0;
	let foundNumbers = new Array<boolean>();

	while (currentIndex < desc.length) {
		if (isStartOfNumber(desc[currentIndex])) {
			let parsedNumber = readNumber(desc, currentIndex);
			foundNumbers.push(true);
			currentIndex += parsedNumber.text.length;
		}
		else if (desc[currentIndex] === "#") {
			foundNumbers.push(false);
			currentIndex++;
			if (desc[currentIndex] === "-") {
				currentIndex += 2;
			}
		}
		else {
			currentIndex++;
		}
	}

	return foundNumbers;
}

function parseMod(modText: string): { text: string, values: any[] } {
	let templatedModText = "";
	let currentIndex = 0;
	let foundNumbers = [];

	while (currentIndex < modText.length) {
		let currentChar = modText[currentIndex];

		if (isNumberPrefix(currentChar)) {
			currentIndex++;

			if (isStartOfNumberRange(modText, currentIndex)) {
				let range = readRange(modText, currentIndex);
				foundNumbers.push(range);
				currentIndex += range.text.length;
				templatedModText += "#";
			}
			else if (isStartOfNumber(modText[currentIndex])) {
				let parsedNumber = readNumber(modText, --currentIndex);
				foundNumbers.push(parsedNumber.value);
				templatedModText += "#";
				currentIndex += parsedNumber.text.length;
			}
			else {
				templatedModText += currentChar;
			}
		}
		else if (isStartOfNumberRange(modText, currentIndex)) {
			let range = readRange(modText, currentIndex);
			foundNumbers.push(range);
			currentIndex += range.text.length;
			templatedModText += "#";

			if (modText[currentIndex] === "-") {
				currentIndex++;
				let secondRange = readRange(modText, currentIndex);
				foundNumbers.push(secondRange);
				templatedModText += "-#";
				currentIndex += secondRange.text.length;
			}
		}
		else if (isStartOfNumber(currentChar)) {
			let parsedNumber = readNumber(modText, currentIndex);
			foundNumbers.push(parsedNumber.value);
			templatedModText += "#";
			currentIndex += parsedNumber.text.length;

			if (modText[currentIndex] === "-") {
				currentIndex++;
				let secondNumber = readNumber(modText, currentIndex);
				foundNumbers.push(secondNumber.value);
				templatedModText += "-#";
				currentIndex += secondNumber.text.length;
			}
		}
		else {
			templatedModText += currentChar;
			currentIndex++;
		}
	}

	if (templatedModText.indexOf("# second ") !== -1) templatedModText = templatedModText.replace("second", "seconds");

	return {
		text: templatedModText,
		values: foundNumbers.length ? foundNumbers : [1]
	};
}

function readRange(s: string, startIndex: number): { text: string, min: { text: string, value: number }, max: { text: string, value: number } } {
	let currentIndex = startIndex + 1;
	let firstNumber = readNumber(s, currentIndex);
	currentIndex += firstNumber.text.length;

	if (s[currentIndex] === ")") {
		return {
			text: s.substr(startIndex, currentIndex - startIndex),
			min: firstNumber,
			max: firstNumber
		};
	}

	currentIndex++;

	if (s[currentIndex].toLowerCase() === "t") {
		currentIndex += 3;
	}

	let secondNumber = readNumber(s, currentIndex);
	currentIndex += secondNumber.text.length + 1;

	return {
		text: s.substr(startIndex, currentIndex - startIndex),
		min: firstNumber,
		max: secondNumber
	};
}

function readNumber(s: string, startIndex: number): { text: string, value: number } {
	let currentNumber = s[startIndex];
	let currentNumberIndex = startIndex + 1;
	while (currentNumberIndex < s.length && isNumberCharacter(s[currentNumberIndex])) currentNumber += s[currentNumberIndex++];
	return { text: currentNumber, value: parseFloat(currentNumber) };
}

function isStartOfNumberRange(s: string, startIndex: number) {
	return s[startIndex] === "(" && isStartOfNumber(s[startIndex + 1]);
}

function isStartOfNumber(char: string): boolean {
	return isNumberPrefix(char) || /[0-9]/.test(char)
}

function isNumberCharacter(char: string): boolean {
	return /[0-9]/.test(char) || char === ".";
}

function isNumberPrefix(char: string): boolean {
	return char === "-" || char === "+";
}

function toList<T>(nodeList: { length: number, item: (index: number) => T }): Immutable.List<T> {
	let result = Immutable.List<T>();
	for (let i = 0; i < nodeList.length; i++) result = result.push(nodeList.item(i));
	return result;
}
