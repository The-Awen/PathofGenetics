import * as Immutable from "immutable";

export interface BaseItem {
	name: string;
	itemClass: string;
	requirements: ItemRequirements;
	properties: WeaponProperties | ArmourProperties;
	implicitMods: Stat[][];
}

export interface ItemRequirements {
	str: number;
	dex: number;
	int: number;
	level: number;
}

export interface WeaponProperties {
	criticalStrikeChange: number;
	attackSpeed: number;
	minDamage: number;
	maxDamage: number;
	range: number;
}

export interface ArmourProperties {
	armour: number;
	evasion: number;
	energyShield: number;
}

export interface Stat {
	id: string;
	min: number;
	max: number;
}

export interface StatDefinition {
	source: string;
	uniqueIdentifier: string;
	identifiers: string[];
	descriptions: StatDescription[];
}

export interface StatDescription {
	text: string;
	query: StatQuery[];
}

export interface StatQuery {
	type: string;
	upperLimit: number;
	lowerLimit: number;
	value: number;
};

export interface UniqueItem {
	name: string;
	itemClass: string;
	baseTypeName: string;
	requirements: ItemRequirements;
	properties: WeaponProperties | ArmourProperties;
	implicitMods: Stat[][];
	explicitMods: Stat[][];
}

export class StatDefinitionCollection {
	public allModifiers: Immutable.List<{ text: string, id: string }>;

	constructor(private stats: StatDefinition[]) {
		this.allModifiers = Immutable.List(this.stats)
			.filter(d => d.source === "stat_descriptions.txt")
			.flatMap<StatDefinition, { text: string, id: string }>(s => s.descriptions.map(d => ({ text: d.text, id: s.uniqueIdentifier })))
			.groupBy(m => m.text)
			.map(g => g.first())
			.toList();
	}

	public numStatValues(modText: string): number[] {
		let matchingStat = this.stats.find(s => s.descriptions.some(d => d.text === modText));
		if (!matchingStat) return [];

		let matchingDesc = matchingStat.descriptions.find(d => d.text === modText);
		let result = [];
		for (let i = 0; i < matchingDesc.query.length; i++) result[i] = i;
		return result;
	}

	public findStatByText(modText: string): StatDefinition {
		return this.stats.find(s => s.descriptions.some(d => d.text === modText));
	}

	public findStatById(modId: string): StatDefinition {
		return this.stats.find(s => s.identifiers.some(id => id === modId));
	}

	public lookupStatDescription(statsToLookup: Array<{ id: string, min: number, max: number }>): StatDescription {
		let matchingStat = this.stats.find(s => statsToLookup.every(x => s.identifiers.indexOf(x.id) !== -1));
		if (!matchingStat) throw new Error("Couldn't find stat for: " + JSON.stringify(statsToLookup));
		let matchingDesc = matchingStat.descriptions.find(d => this.descriptionIsMatch(d.query, statsToLookup));
		if (!matchingDesc) throw new Error("Couldn't find description for: " + JSON.stringify(statsToLookup) + "\r\n" + JSON.stringify(matchingStat));
		return matchingDesc;
	}

	private descriptionIsMatch(queries: StatQuery[], statsToLookup: Array<{ id: string, min: number, max: number }>): boolean {
		return queries.every((q, index) => this.runStatQuery(q, statsToLookup[index]))
	}

	private runStatQuery(statQuery: StatQuery, statValues: { id: string, min: number, max: number }): boolean {
		if (statQuery.type == "fixed") return statValues.max == statQuery.value;
		if (statQuery.type == "anynumber") return true;
		if (statQuery.type == "lessthan") return statValues.max <= statQuery.upperLimit;
		return statValues.max >= statQuery.lowerLimit;
	}
}
