import { ItemModRecord, ItemRecord } from "../../state/items-state";
import { uniques, stats, bases, itemClasses } from "modules/data";

let armourScalarMods = [
	"base_physical_damage_reduction_rating",
	"local_base_physical_damage_reduction_rating",
	"base_physical_damage_reduction_and_evasion_rating"
];

let armourPercentMods = [
	"physical_damage_reduction_rating_+%",
	"local_physical_damage_reduction_rating_+%",
	"local_armour_and_energy_shield_+%",
	"local_armour_and_evasion_+%",
	"local_armour_and_evasion_and_energy_shield_+%"
];

let evasionScalarMods = [
	"base_evasion_rating",
	"local_base_evasion_rating",
	"base_physical_damage_reduction_and_evasion_rating"];

let evasionPercentMods = [
	"evasion_and_physical_damage_reduction_rating_+%",
	"evasion_rating_+%",
	"local_evasion_rating_+%",
	"local_armour_and_evasion_+%",
	"local_evasion_and_energy_shield_+%",
	"local_armour_and_evasion_and_energy_shield_+%"
];

let energyShieldScalarMods = [
	"local_energy_shield"
];

let energyShieldPercentMods = [
	"local_energy_shield_+%",
	"local_evasion_and_energy_shield_+%",
	"local_armour_and_energy_shield_+%",
	"local_armour_and_evasion_and_energy_shield_+%"
];

export class ArmourCalculations {
	public static totalArmour(item: ItemRecord): number {
		return this.totalDefense(item, "armour", armourScalarMods, armourPercentMods);
	}

	public static totalEvasion(item: ItemRecord): number {
		return this.totalDefense(item, "evasion", evasionScalarMods, evasionPercentMods);
	}

	public static totalEnergyShield(item: ItemRecord): number {
		return this.totalDefense(item, "energyShield", energyShieldScalarMods, energyShieldPercentMods);
	}

	private static totalDefense(item: ItemRecord, propertyName: string, scalarMods: string[], percentMods: string[]): number {
		let base = bases.find(b => b.name === item.baseType);
		let baseDefenseAmount = base.properties[propertyName];

		let allMods = item.implicitMods.concat(item.explicitMods)
			.map(m => ({ mod: m, stat: stats.findStatByText(m.text) }))
			.filter(m => m.stat !== undefined)
			.filter(m => !m.mod.statValues.isEmpty() && m.mod.statValues.every(v => !isNaN(parseFloat(v))));

		let scalarAmount = allMods
			.filter(m => scalarMods.some(statId => m.stat.identifiers.some(id => id === statId)))
			.valueSeq()
			.reduce((x, y) => x + parseInt(y.mod.statValues.get(0)), baseDefenseAmount);

		let increasedPercent = allMods
			.filter(m => percentMods.some(statId => m.stat.identifiers.some(id => id === statId)))
			.valueSeq()
			.reduce((x, y) => x + parseInt(y.mod.statValues.get(0)), 100 + parseInt(item.quality)) / 100;

		return Math.round(scalarAmount * increasedPercent);
	}
}