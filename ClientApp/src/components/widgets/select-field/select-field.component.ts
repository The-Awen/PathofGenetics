import { StatePath } from "components/state-path/state-path.directive";
import { StateStore, GemFactory, GemSetFactory, GemSetRecord, GemSet, Gem } from "state";
import { Component, Input, OnInit, EventEmitter, Output } from "@angular/core";
import * as Immutable from "immutable";

@Component({
	selector: "select-field",
	templateUrl: "select-field.component.html",
	styleUrls: ["select-field.component.scss"],
	host: { "class": "field-input" }
})
export class SelectField {
	@Input("options") public optionList: Immutable.List<any>;
	public constructor(private state: StatePath) { }
}