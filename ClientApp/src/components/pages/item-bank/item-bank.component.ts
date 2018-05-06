import { SelectItem } from '../../widgets/select-field/select-item';
import { Component, Input } from '@angular/core';
import * as Immutable from 'immutable';
import { bases, itemClasses, stats, uniques, weaponTypes } from 'modules/data';
import { AppStateRecord, ItemFactory, ItemModFactory, ItemModRecord, ItemRecord } from 'state';
import { StateStore } from 'state';
import { ArmourCalculations } from "shared/calculations/armour-calculations";
import { WeaponCalculations } from "shared/calculations/weapon-calculations";
import { UniqueItem, BaseItem } from "assets/items/item-data-types";

@Component({
	selector: "poe-item-bank",
	templateUrl: "item-bank.component.html",
	styleUrls: ["item-bank.component.scss"]
})
export class ItemBank {
	public bases = bases;
	public uniques = uniques;
	public stats = stats;
	public weaponTypes = weaponTypes;
	public itemClasses = itemClasses.map(c => ({ text: c, value: c }));
	public uniqueItemsSelectItems = uniques.map(i => ({ text: i.name, value: i.name })).toArray();
	public modifiersSelectItems = stats.allModifiers.map(i => ({ text: i.text, value: i.text })).toArray();

	public constructor(private store: StateStore) { }

	public get calculations(): any {
		let itemStats = [];

		if (this.isArmour) {
			itemStats.push(
				{ text: "Armour", total: ArmourCalculations.totalArmour(this.selectedItem) },
				{ text: "Evasion", total: ArmourCalculations.totalEvasion(this.selectedItem) },
				{ text: "Energy Shield", total: ArmourCalculations.totalEnergyShield(this.selectedItem) });
		}
		else {
			itemStats.push(
				{ text: "Critical Strike Chance", total: WeaponCalculations.crit(this.selectedItem).toFixed(2) },
				{ text: "Attacks per Second", total: WeaponCalculations.aps(this.selectedItem).toFixed(2) },
				{ text: "Total DPS", total: WeaponCalculations.totalDPS(this.selectedItem) },
				{ text: "Elemental DPS", total: WeaponCalculations.elementalDPS(this.selectedItem) },
				{ text: "Physical DPS", total: WeaponCalculations.physicalDPS(this.selectedItem) },
				{ text: "Fire DPS", total: WeaponCalculations.fireDPS(this.selectedItem) },
				{ text: "Cold DPS", total: WeaponCalculations.coldDPS(this.selectedItem) },
				{ text: "Lightning DPS", total: WeaponCalculations.lightningDPS(this.selectedItem) },
				{ text: "Chaos DPS", total: WeaponCalculations.chaosDPS(this.selectedItem) }
			);
		}

		return itemStats;
	}

	public itemFactory(appState: AppStateRecord): AppStateRecord {
		return appState.setIn(["itemState", "bank"], appState.itemState.bank.push(ItemFactory()));
	}

	public get isArmour(): boolean {
		return !this.isWeapon;
	}

	public get isWeapon(): boolean {
		return this.weaponTypes.some(t => t === this.currentBaseItem.itemClass);
	}

	public get baseTypesForItemClass(): Immutable.Iterable<number, SelectItem> {
		return this.bases.filter(b => b.itemClass === this.selectedItem.itemClass).map(i => ({ text: i.name, value: i.name }));
	}

	public get selectedItem(): ItemRecord {
		return this.store.currentState.itemState.bank.get(this.store.currentState.uiState.listSelectionIndex);
	}

	public get currentUniqueItem(): UniqueItem {
		return this.uniques.find(u => u.name === this.store.currentState.uiState.itemBank.uniqueName);
	}

	public get currentBaseItem(): BaseItem {
		return bases.find(b => b.name === this.selectedItem.baseType);
	}

	public keyValuesAsList(obj: any): any[] {
		let keyValues = [];
		for (let key in obj) keyValues.push({ name: key, value: obj[key] });
		return keyValues;
	}

	public addModifier(modListName: string): void {
		this.store.update(appState => appState.setIn(
			["itemState", "bank", this.store.currentState.uiState.listSelectionIndex, modListName],
			this.selectedItem[modListName].push(ItemModFactory())));
	}

	public onItemClassChanged(itemClass: string): void {
		let firstBaseItem = bases.filter(b => b.itemClass === itemClass).first();
		let updatedItem = this.selectedItem.set("baseType", firstBaseItem.name);
		this.saveSelectedItem(updatedItem);
	}

	public syncUnique(): void {
		let unique = this.currentUniqueItem;
		this.store.update(appState => appState.setIn(["uiState", "itemBank", "uniqueName"], ""));

		if (!unique) return;

		let base = bases.find(b => b.name === unique.baseTypeName);

		this.saveSelectedItem(ItemFactory()
			.set("name", unique.name)
			.set("itemClass", base.itemClass)
			.set("baseType", base.name)
			.set("implicitMods", this.baseTypeImplicitModifiers(base))
			.set("explicitMods", Immutable.List<any>(unique.explicitMods).map(m => ItemModFactory()
				.set("text", stats.lookupStatDescription(m).text)
				.set("statValues", Immutable.List<string>(m.map(v => v.max))))
				.toList()));
	}

	public syncBaseTypeMods(): void {
		this.saveSelectedItem(this.selectedItem.set("implicitMods", this.baseTypeImplicitModifiers(this.currentBaseItem)));
	}

	private baseTypeImplicitModifiers(baseItem: any): Immutable.List<ItemModRecord> {
		if (baseItem.implicitMods.length === 0) return Immutable.List<any>().push(ItemModFactory());

		return Immutable.List<any>(baseItem.implicitMods).map(m => ItemModFactory()
			.set("text", stats.lookupStatDescription(m).text)
			.set("statValues", Immutable.List<string>(m.map(v => v.max))))
			.toList();
	}

	public saveSelectedItem(item: ItemRecord): void {
		this.store.update(s => s.setIn(["itemState", "bank", s.uiState.listSelectionIndex], item));
	}

	public getModId(index: number, mod: ItemModRecord): string {
		return mod.id;
	}

	public onModTextChanged(mod: ItemModRecord): void {
		if (this.selectedItem.implicitMods.some(m => m.id === mod.id)) {
			let modIndex = this.selectedItem.implicitMods.findIndex(m => m.id === mod.id);
			this.store.update(s => s.setIn(["itemState", "bank", s.uiState.listSelectionIndex, "implicitMods", modIndex, "statValues"], Immutable.List<string>()));
		}
		else {
			let modIndex = this.selectedItem.explicitMods.findIndex(m => m.id === mod.id);
			this.store.update(s => s.setIn(["itemState", "bank", s.uiState.listSelectionIndex, "explicitMods", modIndex, "statValues"], Immutable.List<string>()));
		}
	}
}