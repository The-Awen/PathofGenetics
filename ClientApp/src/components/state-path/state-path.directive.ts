import { AppStateRecord } from "../../state/app-state";
import { StateStore } from "state";
import { Component, Input, OnInit, EventEmitter, Output, Directive, Injectable, Optional, Injector, SkipSelf, Host, Inject, forwardRef } from "@angular/core";
import * as Immutable from "immutable";
import { Observable } from "rxjs";

@Directive({
	selector: "[state-path]",
	providers: [StatePath]
})
export class StatePath {
	private parentStatePath: StatePath;
	@Input("state-path") public statePath: Array<any>;
	public appState: AppStateRecord;

	public constructor( @SkipSelf() @Optional() @Host() @Inject(forwardRef(() => StatePath)) parentStatePath: StatePath, private store: StateStore) {
		this.parentStatePath = parentStatePath;
		this.store.select(a => a).subscribe(a => this.appState = a);
	}

	public get currentObject(): any {
		return this.store.currentState.getIn(this.computeStatePath());
	}

	public set currentObject(newObj: any) {
		this.store.update(s => s.setIn(this.computeStatePath(), newObj));
	}

	public get observable(): Observable<any> {
		return this.store.select(s => s.getIn(this.computeStatePath()));
	}

	public computeStatePath(): Array<any> {
		let currentPath = [];
		let currentDirective: StatePath = this;

		while (currentDirective) {
			if (currentDirective.statePath[0] === '$') {
				currentPath = currentDirective.statePath.concat(currentPath);
				currentPath.shift();
				return currentPath;
			}

			currentPath = currentDirective.statePath.concat(currentPath);
			currentDirective = currentDirective.parentStatePath;
		}

		return currentPath;
	}
}
