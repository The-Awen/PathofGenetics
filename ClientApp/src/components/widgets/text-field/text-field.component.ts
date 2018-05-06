import { StatePath } from "components/state-path/state-path.directive";
import { StateStore, GemFactory, GemSetFactory, GemSetRecord, GemSet, Gem } from "state";
import { Component, Input, OnInit, EventEmitter, Output, ElementRef } from "@angular/core";
import * as Immutable from "immutable";

@Component({
	selector: "text-field",
	templateUrl: "text-field.component.html",
	styleUrls: ["text-field.component.scss"],
	host: { "class": "field-input" }
})
export class TextField {
	@Input() public placeholder: string = "";
	public constructor(private state: StatePath) { }
}