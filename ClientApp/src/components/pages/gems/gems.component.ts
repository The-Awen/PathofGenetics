import { GemFactory, GemSetFactory, GemSetRecord, GemSet, Gem, AppStateRecord } from "state";
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import * as Immutable from 'immutable';
import { gems } from 'modules/data';
import { StateStore } from 'state';
import { Observable } from "rxjs";
import { SelectItem } from "components/widgets/select-field/select-item";

@Component({
	selector: "poe-gems",
	templateUrl: "gems.component.html",
	styleUrls: ["gems.component.scss"]
})
export class Gems {
	public allGemsSelectItems: Array<SelectItem> = gems.map(g => ({ text: g.name, value: g.name }));
	public constructor(private store: StateStore) { }

	public createNewGemSet(appState: AppStateRecord): AppStateRecord {
		return appState.setIn(["gemState", "gemSets"], appState.gemState.gemSets.push(GemSetFactory()));

	}
}