import { ItemModRecord, ItemRecord } from "../../state/items-state";
import { uniques, stats, bases, itemClasses } from "modules/data";
import { CalculationHelpers } from "shared/calculations/calculation-helpers";

let attackSpeedMods = [
	"local_attack_speed_+%",
	"attack_speed_+%"
];

let damageScalarMods = [
	"attack_minimum_added_%1_damage",
	"attack_maximum_added_%1_damage",
	"global_minimum_added_%1_damage",
	"global_maximum_added_%1_damage",
	"local_minimum_added_%1_damage",
	"local_maximum_added_%1_damage"
];

let physicalPercentIncreaseMods = [
	"physical_damage_+%",
	"local_physical_damage_+%"
];

let increasedCriticalStrikeChanceMods = [
	"local_critical_strike_chance_+%"
];

let physicalDamageScalarMods = damageScalarMods.map(s => s.replace("%1", "physical"));
let fireDamageScalarMods = damageScalarMods.map(s => s.replace("%1", "fire"));
let coldDamageScalarMods = damageScalarMods.map(s => s.replace("%1", "cold"));
let lightningDamageScalarMods = damageScalarMods.map(s => s.replace("%1", "lightning"));
let chaosDamageScalarMods = damageScalarMods.map(s => s.replace("%1", "chaos"));

export class WeaponCalculations {
	public static crit(item: ItemRecord): number {
		let modsWithStats = CalculationHelpers.pairModsWithStats(item);
		let base = bases.find(b => b.name === item.baseType);
		let baseCritStrikeChance = <number>base.properties["criticalStrikeChance"];

		let percentIncrease = CalculationHelpers
			.filterMods(modsWithStats, increasedCriticalStrikeChanceMods)
			.reduce((x, y) => x + parseInt(y.mod.statValues.get(0)), baseCritStrikeChance);

		return baseCritStrikeChance * (1 + percentIncrease / 100);
	}

	public static physicalDPS(item: ItemRecord): number {
		let base = bases.find(b => b.name === item.baseType);
		let basePhysicalRange = { min: base.properties["minDamage"], max: base.properties["maxDamage"] };
		let modsWithStats = CalculationHelpers.pairModsWithStats(item);

		let damageRange = CalculationHelpers
			.filterMods(modsWithStats, physicalDamageScalarMods)
			.reduce((x, y) => ({ min: x.min + parseInt(y.mod.statValues.get(0)), max: x.max + parseInt(y.mod.statValues.get(1)) }), basePhysicalRange);

		let percentIncrease = CalculationHelpers
			.filterMods(modsWithStats, physicalPercentIncreaseMods)
			.reduce((x, y) => x + parseInt(y.mod.statValues.get(0)), 0);

		return Math.round(WeaponCalculations.aps(item) * ((damageRange.min + damageRange.max) * (1 + (percentIncrease + parseInt(item.quality)) / 100) / 2));
	}

	public static fireDPS(item: ItemRecord): number {
		return WeaponCalculations.singleTypeDPS(item, fireDamageScalarMods);
	}

	public static coldDPS(item: ItemRecord): number {
		return WeaponCalculations.singleTypeDPS(item, coldDamageScalarMods);
	}

	public static lightningDPS(item: ItemRecord): number {
		return WeaponCalculations.singleTypeDPS(item, lightningDamageScalarMods);
	}

	public static chaosDPS(item: ItemRecord): number {
		return WeaponCalculations.singleTypeDPS(item, chaosDamageScalarMods);
	}

	public static elementalDPS(item: ItemRecord): number {
		return WeaponCalculations.coldDPS(item) + WeaponCalculations.fireDPS(item) + WeaponCalculations.lightningDPS(item);
	}

	public static totalDPS(item: ItemRecord): number {
		return WeaponCalculations.physicalDPS(item) + WeaponCalculations.elementalDPS(item) + WeaponCalculations.chaosDPS(item);
	}

	private static singleTypeDPS(item: ItemRecord, mods: string[]): number {
		let modsWithStats = CalculationHelpers.pairModsWithStats(item);
		let damageRange = CalculationHelpers
			.filterMods(modsWithStats, mods)
			.reduce((x, y) => ({ min: x.min + parseInt(y.mod.statValues.get(0)), max: x.max + parseInt(y.mod.statValues.get(1)) }), { min: 0, max: 0 });

		return Math.round(WeaponCalculations.aps(item) * ((damageRange.min + damageRange.max) / 2));
	}

	public static aps(item: ItemRecord): number {
		let base = bases.find(b => b.name === item.baseType);
		let baseAttackSpeed = base.properties["attackSpeed"];
		let modsWithStats = CalculationHelpers.pairModsWithStats(item);
		let increasedAttackSpeedAmount = CalculationHelpers
			.filterMods(modsWithStats, attackSpeedMods)
			.reduce((x, y) => x + parseFloat(y.mod.statValues.get(0)) / 100, 1);

		return baseAttackSpeed * increasedAttackSpeedAmount;
	}
}
