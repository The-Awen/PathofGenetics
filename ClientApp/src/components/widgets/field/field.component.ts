import { StatePath } from "components/state-path/state-path.directive";
import { StateStore, GemFactory, GemSetFactory, GemSetRecord, GemSet, Gem } from "state";
import { Component, Input, OnInit, EventEmitter, Output } from "@angular/core";
import * as Immutable from "immutable";

@Component({
	selector: "field",
	templateUrl: "field.component.html",
	styleUrls: ["field.component.scss"],
	host: {
		"class": "field",
		"(input)": "onInputChanged($event.srcElement.value)",
		"(focusin)": "hasFocus = true",
		"(focusout)": "hasFocus = false",
		"(internalChangeEvent)": "onInternalChanged($event.detail.newValue)",
		"[class.focused]": "hasFocus"
	}
})
export class Field {
	@Output("onChange") public onChangeEventEmitter: EventEmitter<string> = new EventEmitter<string>();
	@Input("skipStateUpdate") public skipStateUpdate: boolean;

	public constructor(private state: StatePath) { }

	public onInputChanged(newValue: string): void {
		if (!this.skipStateUpdate) this.state.currentObject = newValue;
		this.onChangeEventEmitter.emit(newValue);
	}

	public onInternalChanged(newValue: string): void {
		this.onInputChanged(newValue);
	}
}