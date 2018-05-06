import * as Immutable from "immutable";
import { TypedRecord, makeTypedFactory } from "typed-immutable-record";
import { NodeStateEnum, NodeStateRecord } from "state";

export interface TreeState {
	readonly name: string;
	readonly selectedClass: number;
	readonly selectedSubClass: number;
	readonly pointsSpent: number;
	readonly ascendancyPointsSpent: number;
	readonly nodeStates: Immutable.Map<number, NodeStateRecord>;
	readonly searchResultNodeIds: Immutable.List<number>;
	readonly hash: string;
	readonly isAscendancyClassVisible: boolean;
}

export interface TreeStateRecord extends TypedRecord<TreeStateRecord>, TreeState { }

export const TreeStateFactory = makeTypedFactory<TreeState, TreeStateRecord>({
	name: "Placeholder Tree Name",
	hash: "",
	pointsSpent: 0,
	ascendancyPointsSpent: 0,
	selectedClass: 0,
	selectedSubClass: 0,
	searchResultNodeIds: Immutable.List<number>(),
	nodeStates: Immutable.Map<number, NodeStateRecord>(),
	isAscendancyClassVisible: false
});

export interface NodeState {
	readonly id: number;
	readonly activeState: NodeStateEnum;
	readonly isHighlighted: boolean;
	readonly isOrphanHighlighted: boolean;
	readonly hovered: boolean;
}

export interface NodeStateRecord extends TypedRecord<NodeStateRecord>, NodeState { }

export const NodeStateFactory = makeTypedFactory<NodeState, NodeStateRecord>({
	id: 0,
	activeState: NodeStateEnum.Inactive,
	isHighlighted: false,
	isOrphanHighlighted: false,
	hovered: false
});
