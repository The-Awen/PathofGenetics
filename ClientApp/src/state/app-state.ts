import { TreeStateRecord, TreeStateFactory, GemStateFactory, GemStateRecord, ItemStateRecord, ItemStateFactory, ItemRecord } from "state";
import { TypedRecord, makeTypedFactory } from "typed-immutable-record/dist";
import { SkillTree } from "state/tree-model";
import * as Immutable from "immutable";

export interface ItemBankState {
	readonly uniqueName: string;
}

export interface SkillTreeUIState {
	readonly searchText: string;
	readonly importUrl: string;
	readonly hoveredNodeIds: Immutable.List<number>;
	readonly searchFlyoutVisible: boolean;
	readonly importFlyoutVisible: boolean;
}

export interface UserInterfaceState {
	readonly listSelectionIndex: number;
	readonly itemBank: ItemBankStateRecord;
	readonly skillTree: SkillTreeUIStateRecord;
	readonly loadingComplete: boolean;
}

export interface AppState {
	readonly treeModel: SkillTree;
	readonly treeStates: Immutable.List<TreeStateRecord>;
	readonly gemState: GemStateRecord;
	readonly itemState: ItemStateRecord;
	readonly uiState: UserInterfaceStateRecord;
}

export interface ItemBankStateRecord extends TypedRecord<ItemBankStateRecord>, ItemBankState { }
export interface SkillTreeUIStateRecord extends TypedRecord<SkillTreeUIStateRecord>, SkillTreeUIState { }
export interface UserInterfaceStateRecord extends TypedRecord<UserInterfaceStateRecord>, UserInterfaceState { }
export interface AppStateRecord extends TypedRecord<AppStateRecord>, AppState { }

export const ItemBankStateRecordFactory = makeTypedFactory<ItemBankState, ItemBankStateRecord>({
	uniqueName: ""
});

export const SkillTreeUIStateRecordFactory = makeTypedFactory<SkillTreeUIState, SkillTreeUIStateRecord>({
	searchFlyoutVisible: false,
	importFlyoutVisible: false,
	searchText: "",
	importUrl: "",
	hoveredNodeIds: Immutable.List<number>()
});

export const UserInterfaceStateRecordFactory = makeTypedFactory<UserInterfaceState, UserInterfaceStateRecord>({
	listSelectionIndex: 0,
	itemBank: ItemBankStateRecordFactory(),
	skillTree: SkillTreeUIStateRecordFactory(),
	loadingComplete: false
});

export const AppStateFactory = makeTypedFactory<AppState, AppStateRecord>({
	uiState: UserInterfaceStateRecordFactory(),
	treeModel: null,
	treeStates: Immutable.List<TreeStateRecord>(),
	gemState: GemStateFactory(),
	itemState: ItemStateFactory()
});
