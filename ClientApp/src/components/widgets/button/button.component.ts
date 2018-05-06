import { StatePath } from "components/state-path/state-path.directive";
import { StateStore, GemFactory, GemSetFactory, GemSetRecord, GemSet, Gem } from "state";
import { Component, Input, OnInit, EventEmitter, Output } from "@angular/core";
import * as Immutable from "immutable";

@Component({
	selector: "button",
	templateUrl: "button.component.html",
	styleUrls: ["button.component.scss"]
})
export class Button {
	public constructor(private store: StateStore) { }
}