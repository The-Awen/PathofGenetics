import { ItemModRecord } from '../../state/items-state';
import { ItemRecord } from "state";
import { uniques, stats, bases, itemClasses } from "modules/data";
import * as Immutable from "immutable";
import { StatDefinition } from "assets/items/item-data-types";

export class CalculationHelpers {
	public static pairModsWithStats(item: ItemRecord): Immutable.Iterable<number, { mod: ItemModRecord, stat: StatDefinition }> {
		return item.implicitMods.concat(item.explicitMods)
			.map(m => ({ mod: m, stat: stats.findStatByText(m.text) }))
			.filter(m => m.stat !== undefined)
			.filter(m => !m.mod.statValues.isEmpty() && m.mod.statValues.every(v => !isNaN(parseFloat(v))));
	}

	public static filterMods(mods: Immutable.Iterable<number, { mod: ItemModRecord, stat: StatDefinition }>, statIds: string[]) {
		return mods.filter(m => statIds.some(statId => m.stat.identifiers.some(id => id === statId))).valueSeq();
	}
}
