import { TypedRecord, makeTypedFactory } from "typed-immutable-record/dist";
import * as Immutable from "immutable";
import * as UUID from "uuid";

let makeFactoryForUniqueIdentifier = <T extends { id: string } & TypedRecord<T>>(factoryFunc: () => T): (() => T) => {
	return () => {
		let o = factoryFunc();
		return o.set("id", UUID.v4());
	};
}

export interface ItemMod {
	readonly id: string;
	readonly statValues: Immutable.List<string>;
	readonly text: string;
}

export interface ItemModRecord extends TypedRecord<ItemModRecord>, ItemMod { }

export const ItemModFactory = makeFactoryForUniqueIdentifier(makeTypedFactory<ItemMod, ItemModRecord>({
	id: "",
	statValues: Immutable.List<string>(),
	text: ""
}));

export interface ItemSet {
	readonly id: string;
	readonly name: string;
	readonly helmet: ItemRecord;
	readonly gloves: ItemRecord;
	readonly boots: ItemRecord;
	readonly belt: ItemRecord;
	readonly chest: ItemRecord;
	readonly mainHand: ItemRecord;
	readonly offHand: ItemRecord;
	readonly amulet: ItemRecord;
	readonly leftRing: ItemRecord;
	readonly rightRing: ItemRecord;
}

export interface ItemSetRecord extends TypedRecord<ItemSetRecord>, ItemSet { }

export const ItemSetFactory = makeFactoryForUniqueIdentifier(makeTypedFactory<ItemSet, ItemSetRecord>({
	id: "",
	name: "New Item Set",
	helmet: null,
	gloves: null,
	boots: null,
	belt: null,
	chest: null,
	mainHand: null,
	offHand: null,
	amulet: null,
	leftRing: null,
	rightRing: null
}));

export interface Item {
	readonly id: string;
	readonly name: string;
	readonly itemClass: string;
	readonly baseType: string;
	readonly implicitMods: Immutable.List<ItemModRecord>;
	readonly explicitMods: Immutable.List<ItemModRecord>;
	readonly quality: string;
}

export interface ItemRecord extends TypedRecord<ItemRecord>, Item { }

export const ItemFactory = makeFactoryForUniqueIdentifier(makeTypedFactory<Item, ItemRecord>({
	id: UUID.v4(),
	name: "New Item",
	itemClass: "One Hand Axes",
	baseType: "Rusted Hatchet",
	implicitMods: Immutable.List<ItemModRecord>().push(ItemModFactory()),
	explicitMods: Immutable.List<ItemModRecord>().push(ItemModFactory()),
	quality: "20"
}));

export interface ItemState {
	readonly itemSets: Immutable.List<ItemSetRecord>;
	readonly bank: Immutable.List<ItemRecord>;
}

export interface ItemStateRecord extends TypedRecord<ItemStateRecord>, ItemState { }

export const ItemStateFactory = makeTypedFactory<ItemState, ItemStateRecord>({
	itemSets: Immutable.List<ItemSetRecord>().push(ItemSetFactory()),
	bank: Immutable.List<ItemRecord>()
});
