import { TypedRecord, makeTypedFactory } from "typed-immutable-record/dist";
import * as Immutable from "immutable";
import * as UUID from "uuid";

export interface Gem {
	readonly id: string;
	readonly name: string;
	readonly quality: string;
	readonly level: string;
}

export interface GemRecord extends TypedRecord<GemRecord>, Gem { }
export const GemFactory = makeTypedFactory<Gem, GemRecord>({ id: UUID.v4(), name: "", quality: "20", level: "20" });

export interface GemSet {
	readonly id: string;
	readonly name: string;
	readonly gems: Immutable.List<GemRecord>;
}

export interface GemSetRecord extends TypedRecord<GemSetRecord>, GemSet { }
export const GemSetFactory = makeTypedFactory<GemSet, GemSetRecord>({ id: UUID.v4(), name: "New Gem Set", gems: Immutable.Range(0, 6).map(i => GemFactory()).toList() });

export interface GemState {
	readonly gemSets: Immutable.List<GemSetRecord>;
}

export interface GemStateRecord extends TypedRecord<GemStateRecord>, GemState { }
export const GemStateFactory = makeTypedFactory<GemState, GemStateRecord>({ gemSets: Immutable.List<GemSetRecord>().push(GemSetFactory()) });