import { Component, Input } from "@angular/core";
import * as Immutable from "immutable";
import { Browser } from "shared/browser";
import { Point } from "shared/geometry";
import { Node } from "state/tree-model";
import { StateStore, AppStateRecord } from "state";

@Component({
	selector: "poe-node-details",
	templateUrl: "nodedetails.component.html",
	styleUrls: ["nodedetails.component.scss"]
})
export class NodeDetails {
	private currentNode: Node;
	private pointDifference: number;
	@Input("mouse-position") currentMousePosition: Point;

	public constructor(private browser: Browser, private store: StateStore) { }

	public ngAfterViewInit(): void {
		this.store
			.select(s => s.uiState.skillTree.hoveredNodeIds)
			.subscribe(hoveredNodeIds => {
				let hoveredNodes = this.store.currentState.treeModel.GetNodesByIds(hoveredNodeIds).filter(n => n.IsSkill);
				this.currentNode = hoveredNodes.isEmpty() ? null : hoveredNodes.first();
				this.pointDifference = this.store.currentState.treeStates.get(this.store.currentState.uiState.listSelectionIndex).nodeStates.count(n => n.isHighlighted);
				if (this.pointDifference == 0) this.pointDifference = -this.store.currentState.treeStates.get(this.store.currentState.uiState.listSelectionIndex).nodeStates.count(n => n.isOrphanHighlighted);
			});
	}
}