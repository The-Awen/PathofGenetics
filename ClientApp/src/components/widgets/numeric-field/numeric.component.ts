import { StatePath } from "components/state-path/state-path.directive";
import { StateStore, GemFactory, GemSetFactory, GemSetRecord, GemSet, Gem } from "state";
import { Component, Input, OnInit, EventEmitter, Output, ElementRef } from "@angular/core";
import * as Immutable from "immutable";

@Component({
	selector: "numeric-field",
	templateUrl: "numeric.component.html",
	styleUrls: ["numeric.component.scss"],
	host: { "class": "field-input" }
})
export class NumericField {
	@Input() public max: number = 10;
	@Input() public min: number = 0;

	public constructor(private state: StatePath, private elementRef: ElementRef) { }

	private allowableKeys: string[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => n.toString());
	private allowableKeyCodes: number[] = [38, 40, 9, 35, 36, 46, 8];

	public onKeyDown(e: KeyboardEvent): void {
		if (this.allowableKeys.indexOf(e.key) === -1 && this.allowableKeyCodes.indexOf(e.keyCode) === -1) {
			e.preventDefault();
			return;
		}

		if (e.keyCode === 38) this.step(1);
		else if (e.keyCode === 40) this.step(-1);
	}

	public onPaste(e: ClipboardEvent): void {
		e.preventDefault();
		this.setValue(parseInt(this.removeNumbers(e.clipboardData.getData("text/plain"))));
	}

	public step(amount: number): void {
		let currentValue = parseInt(this.state.currentObject) || this.min;
		this.setValue(this.constrainValue(this.min, currentValue + amount, this.max));
	}

	private setValue(newValue: number): void {
		this.elementRef.nativeElement.dispatchEvent(new CustomEvent("internalChangeEvent", { detail: { newValue: newValue.toString() }, bubbles: true }));
	}

	private removeNumbers(val: string): string {
		return val.replace(/[^0-9]/g, "");
	}

	private constrainValue(min: number, val: number, max: number): number {
		if (val > max) return max;
		if (val < min) return min;
		return val;
	}
}