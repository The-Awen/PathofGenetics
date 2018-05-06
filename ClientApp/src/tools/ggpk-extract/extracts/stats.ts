import * as fs from "fs";
import * as Immutable from "immutable";
import * as path from "path";

export function processStatsFile(descriptionFiles: Immutable.List<string>): any[] {
	let allDescriptions = [];
	let noDescriptions = [];

	descriptionFiles.forEach(f => {
		let lines = fs.readFileSync(f, "utf-16le").split("\n").filter(l => l !== null && l.trim().length > 0);

		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];
			if (line.startsWith("no_description")) {
				noDescriptions.push(line.split(" ")[1]);
			}
			else if (line.startsWith("description")) {
				let identifiers = /\s*\d+\s+(.*)\s*/.exec(lines[i + 1])[1].split(" ").map(id => id.replace(/\t/g, ""));

				if (identifiers.some(id => id.indexOf("old_do_not_use") !== -1)) continue;

				let numDescriptions = parseInt(/^\s*(\d+)\s*$/.exec(lines[i + 2])[1]);
				let descriptions = []

				for (let j = 0; j < numDescriptions; j++) {
					let currentDescription = lines[i + 3 + j];
					let descRegexResult = /\s*(.*)\s\"([^\"]+)\".*/.exec(currentDescription);
					let text = descRegexResult[2];
					[1, 2, 3, 4, 5].forEach(ph => text = text.replace("+%" + ph + "%", "#").replace("%" + ph + "%", "#").replace("%" + ph + "$+d", "#").replace("%" + ph + "$d", "#"));
					text = text.replace("%d", "#").replace(/%%/g, "%").replace(/\\n/g, " ");

					let query = descRegexResult[1].split(" ").map(q => {
						if (q === "#") return { type: "anynumber" };
						if (q.indexOf("|") === -1) return { type: "fixed", value: q };
						let querySubParts = q.split("|");
						if (querySubParts[0] === "#") return { type: "lessthan", upperLimit: parseInt(querySubParts[1]) };
						return { type: "greaterthan", lowerLimit: parseInt(querySubParts[0]) };
					});

					descriptions.push({ "text": text, "query": query });
				}

				allDescriptions.push({
					source: path.basename(f),
					uniqueIdentifier: identifiers.reduce((x, y) => x + y),
					identifiers: identifiers,
					descriptions: descriptions
				});
			}
		}
	});

	allDescriptions.push({
		"source": "custom",
		"uniqueIdentifier": "from_armour_movement_speed_+%",
		"identifiers": ["from_armour_movement_speed_+%"],
		"descriptions": [{
			"text": "#% Reduced Movement Speed",
			"query": [{ "type": "anynumber" }]
		}]
	});

	allDescriptions.push({
		"source": "custom",
		"uniqueIdentifier": "local_stat_monsters_pick_up_item",
		"identifiers": ["local_stat_monsters_pick_up_item"],
		"descriptions": [{
			"text": "Monsters can pickup",
			"query": [{ "type": "anynumber" }]
		}]
	});

	return allDescriptions;
}
