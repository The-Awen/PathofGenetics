import * as Immutable from "immutable";
import { Database, Table, Row } from "../database";

let propertiesToRollUp = ["damageEffectiveness", "manaMultiplier", "criticalStrikeChance"];

export function extractGems(database: Database): any {
	let gems: any[] = database.table("SkillGems.dat").rows().map(r => {
		let activeSkillsKeys = r.join("GrantedEffectsKey").value("ActiveSkillsKey");
		return { name: r.join("BaseItemTypesKey").value("Name"), tags: r.joinMany("GemTagsKeys").map(t => t.value("Tag")).filter(t => t), levels: [] };
	});

	database.table("GrantedEffectsPerLevel.dat").rows().forEach(r => {
		let activeSkillsKeys = r.join("GrantedEffectsKey").value("ActiveSkillsKey");
		if (!activeSkillsKeys) return;
		let gemName = r.join("GrantedEffectsKey").join("ActiveSkillsKey").value("DisplayedName");
		if (!gemName) return;
		let gem = gems.find(g => g.name === gemName);
		if (!gem) return;

		let stats = r.joinMany("StatsKeys").map((stat, index) => ({
			"id": stat.value("Id"),
			"max": r.value("Stat" + (index + 1) + "Value"),
			"min": r.value("Stat" + (index + 1) + "Value")
		}));

		gem.levels.push({
			level: r.value("Level"),
			manaMultiplier: r.value("ManaMultiplier"),
			criticalStrikeChance: r.value("CriticalStrikeChance"),
			manaCost: r.value("ManaCost"),
			damageEffectiveness: r.value("DamageEffectiveness"),
			stats: stats
		});
	});

	gems.forEach(g => {
		if (g.levels.length === 0) return;

		propertiesToRollUp.forEach(p => {
			if (g.levels.map(l => g.levels[0][p] === l[p]).reduce((x, y) => x && y)) {
				g[p] = g.levels[0][p];
				g.levels.forEach(l => { delete l[p]; });
			}
		});
	});

	return gems;
}