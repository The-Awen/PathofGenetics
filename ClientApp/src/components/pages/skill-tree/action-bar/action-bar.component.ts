import { Component, Input, EventEmitter, Output } from "@angular/core";
import * as Immutable from 'immutable';
import { StateStore } from "state";
import { NodeStateEnum, SkillTree, AscendancyClassSpec, ClassSpec } from "state/tree-model";
import { TreeStateOperations } from "shared/services/skill-tree/skill-tree.service";

@Component({
	selector: "poe-skill-tree-action-bar",
	templateUrl: "action-bar.component.html",
	styleUrls: ["action-bar.component.scss"]
})
export class ActionBar {
	private loadFailed: boolean;
	private searchFlyoutVisible: boolean;
	private importFlyoutVisible: boolean;

	public constructor(private store: StateStore) { }

	public ngAfterViewInit(): void {
		this.store.select(s => s.uiState.skillTree.searchText).subscribe(searchText => {
			this.store.update(appState => TreeStateOperations.search(appState, searchText));
		});

		this.store.select(s => s.uiState.skillTree.searchFlyoutVisible).subscribe(v => {
			this.searchFlyoutVisible = v;
			if (!this.searchFlyoutVisible) this.store.update(appState => appState.setIn(["uiState", "skillTree", "searchText"], ""));
		});

		this.store.select(s => s.uiState.skillTree.importFlyoutVisible).subscribe(v => {
			this.importFlyoutVisible = v;
			if (!this.importFlyoutVisible) this.store.update(appState => appState.setIn(["uiState", "skillTree", "importUrl"], ""));
		});
	}

	public searchFlyoutToggled(): void {
		this.store.update(appState => appState.setIn(["uiState", "skillTree", "searchFlyoutVisible"], !appState.uiState.skillTree.searchFlyoutVisible));
	}

	public importFlyoutToggled(): void {
		this.store.update(appState => appState.setIn(["uiState", "skillTree", "importFlyoutVisible"], !appState.uiState.skillTree.importFlyoutVisible));
	}

	private onImportBuild(): void {
		this.store.update(appState => {
			appState = TreeStateOperations.importBuild(appState, appState.uiState.listSelectionIndex, appState.uiState.skillTree.importUrl);
			appState = appState.setIn(["uiState", "skillTree", "importUrl"], "");
			return appState;
		});
	}

	private onBuildReset(): void {
		this.store.update(appState => TreeStateOperations.activateClass(appState, appState.uiState.listSelectionIndex, 0));
	}

	private displayImportFailureMessage(): void {
		this.loadFailed = true;
		setTimeout(() => { this.loadFailed = false; }, 5000);
	}
}
