import { Database, Table, Row } from "../database";

export function extractBaseItems(database: Database, filteredItemClasses: string[]) {
	let baseTypesTable = database.table("BaseItemTypes.dat");

	return baseTypesTable.rows().map(baseTypeRow => {
		let itemClassRow = baseTypeRow.join("ItemClassesKey");

		let resolvedItemClass = filteredItemClasses.indexOf(itemClassRow.value("Category")) !== -1
			? itemClassRow.value("Category")
			: filteredItemClasses.indexOf(itemClassRow.value("Name")) !== -1
				? itemClassRow.value("Name")
				: null;

		if (!resolvedItemClass) return null;

		let properties = {};
		let propTable = database.table("ComponentArmour.dat");
		let propRow = propTable.rows().find(r => r.value("BaseItemTypesKey") === baseTypeRow.value("Id"));

		if (propRow) properties = {
			"armour": propRow.value("Armour"),
			"evasion": propRow.value("Evasion"),
			"energyShield": propRow.value("EnergyShield")
		};

		propTable = database.table("WeaponTypes.dat");
		propRow = propTable.rows().find(r => r.join("BaseItemTypesKey").value("Id") === baseTypeRow.value("Id"));

		if (propRow) properties = {
			"criticalStrikeChance": parseInt(propRow.value("Critical")) / 100,
			"attackSpeed": parseFloat((1000 / parseInt(propRow.value("Speed"))).toFixed(2)),
			"minDamage": propRow.value("DamageMin"),
			"maxDamage": propRow.value("DamageMax"),
			"range": propRow.value("RangeMax")
		};

		let requirements = {};
		let reqTable = database.table("ComponentAttributeRequirements.dat");
		let reqRow = reqTable.rows().find(r => r.value("BaseItemTypesKey") === baseTypeRow.value("Id"));
		if (reqRow) requirements = { "str": reqRow.value("ReqStr"), "dex": reqRow.value("ReqDex"), "int": reqRow.value("ReqInt"), "level": baseTypeRow.value("DropLevel") };

		return {
			name: baseTypeRow.value("Name"),
			itemClass: resolvedItemClass,
			requirements: requirements,
			properties: properties,
			implicitMods: baseTypeRow.joinMany("Implicit_ModsKeys").map(implicitModRow =>
				[1, 2, 3, 4, 5].filter(i => implicitModRow.value("StatsKey" + i) !== null).map(i => ({
					"id": implicitModRow.join("StatsKey" + i).value("Id"),
					"min": parseFloat(implicitModRow.value("Stat" + i + "Min")),
					"max": parseFloat(implicitModRow.value("Stat" + i + "Max"))
				})))
		};
	}).filter(x => x !== null);
}
