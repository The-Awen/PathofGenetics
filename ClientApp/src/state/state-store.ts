import { Store } from "@ngrx/store";
import { AppStateRecord } from "state";
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";


@Injectable()
export class StateStore {
	public currentState: AppStateRecord;

	constructor(private internalStore: Store<AppStateRecord>) {
		internalStore.subscribe(s => this.currentState = s);
	}

	public select<K>(fn: (state: AppStateRecord) => K): Observable<K> {
		return this.internalStore.select(fn);
	}

	public update(fn: (state: AppStateRecord) => AppStateRecord): void {
		this.internalStore.dispatch({ type: "UPDATE", payload: fn })
	}
}