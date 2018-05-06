import { TreeStateRecord } from '../../state/tree-state';
import { AppStateRecord, StateStore, GemFactory, GemSetFactory, GemSetRecord, GemSet, Gem } from "state";
import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import * as Immutable from 'immutable';

@Component({
	selector: "list-editor",
	templateUrl: "list-editor.component.html",
	styleUrls: ["list-editor.component.scss"]
})
export class ListEditor implements OnInit {
	@Input("object-factory") public objectFactory: (appState: AppStateRecord) => AppStateRecord;
	@Input("list-path") public listPath: Array<any>;
	@Input("item-content-template") public itemContentTemplate: TemplateRef<any>;
	public selectedIndex: number;

	public constructor(private store: StateStore) { }

	public get list(): Immutable.List<any> {
		return this.store.currentState.getIn(this.listPath);
	}

	public ngOnInit(): void {
		this.selectItem(0);
	}

	public add(): void {
		this.store.update(s => {
			s = this.objectFactory(s);
			this.selectedIndex = s.getIn(this.listPath).count() - 1;
			return s.setIn(["uiState", "listSelectionIndex"], this.selectedIndex);
		});
	}

	public selectItem(index: number): void {
		this.selectedIndex = index;
		this.store.update(s => s.setIn(["uiState", "listSelectionIndex"], index));
	}

	// public removeSelectedItemFromBank(): void {
	// 	let itemIndex = this.store.currentState.itemState.bank.findIndex(i => i.id === this.selectedItem.id);
	// 	this.store.update(s => s.removeIn(["itemState", "bank", itemIndex]));

	// 	if (this.store.currentState.itemState.bank.count() == 0) {
	// 		this.store.update(s => s.setIn(["itemState", "bank"], s.itemState.bank.push(this.createNewItem())));
	// 	}

	// 	let newSelectedItem = this.store.currentState.itemState.bank.get(Math.max(itemIndex - 1, 0));
	// 	this.selectItem(newSelectedItem);
	// }
}
