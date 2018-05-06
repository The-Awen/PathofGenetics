import { StatePath } from "components/state-path/state-path.directive";
import { StateStore, GemFactory, GemSetFactory, GemSetRecord, GemSet, Gem } from "state";
import { Component, EventEmitter, Input, OnInit, Output, ElementRef, NgZone, ViewChild, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { SelectItem } from 'components/widgets/select-field/select-item';
import * as Immutable from 'immutable';

@Component({
	selector: "combo-field",
	templateUrl: "combo-field.component.html",
	styleUrls: ["combo-field.component.scss"],
	host: { "class": "field-input" },
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComboField {
	@Input("source") public source: SelectItem[];
	@ViewChild("input") public input: ElementRef;

	public filteredList: SelectItem[];
	public selectedIndex: number;
	public isOpen: boolean;
	public numRowsDisplayed = 5;
	public rowHeight = 22;
	public renderedRows = [];
	public topRowIndex: number;
	public topRowOffset: number;

	public constructor(private state: StatePath, private elementRef: ElementRef, private zone: NgZone) { }

	public ngOnInit(): void {
		this.selectedIndex = 0;
		this.source.forEach(s => s.value = s.value.toLowerCase());
		this.computeFilteredList(this.state.currentObject);
	}

	public itemSelected(e: MouseEvent, item: SelectItem): void {
		e.preventDefault();
		this.state.currentObject = item.text;
		this.isOpen = false;
	}

	public onFocusIn(): void {
		this.computeFilteredList(this.state.currentObject);
		let isExactMatch = this.filteredList.some(i => i.text === this.state.currentObject);
		this.isOpen = !isExactMatch && this.state.currentObject.length > 0 && this.filteredList.length > 0;
	}

	public onFocusOut(): void {
		this.isOpen = false;
	}

	public onKeyDown(e: KeyboardEvent): void {
		if (!this.isOpen) return;

		if (e.keyCode === 40) {
			this.selectedIndex++;
			if (this.selectedIndex >= this.filteredList.length) this.selectedIndex = this.filteredList.length - 1;
			this.scrollSelectedItemIntoView();
			e.preventDefault();
		}
		else if (e.keyCode === 38) {
			this.selectedIndex--;
			if (this.selectedIndex < 0) this.selectedIndex = 0;
			this.scrollSelectedItemIntoView();
			e.preventDefault();
		}
		else if (e.keyCode === 13) {
			this.state.currentObject = this.filteredList[this.selectedIndex].text;
			this.isOpen = false;
		}
		else if (e.keyCode === 27) {
			this.isOpen = false;
		}
	}

	public onScroll(e: MouseEvent): void {
		this.topRowIndex = Math.round(e.srcElement.scrollTop / this.rowHeight);
		this.topRowOffset = e.srcElement.scrollTop % this.rowHeight;
		let numRowsToDisplay = this.numRowsDisplayed + (this.topRowOffset > 0 ? 1 : 0);
		this.renderedRows = this.filteredList.slice(this.topRowIndex, this.topRowIndex + numRowsToDisplay);
	}

	private scrollSelectedItemIntoView(): void {
		let containerElement = this.elementRef.nativeElement.querySelector(".auto-complete-window");

		if (this.selectedIndex < this.topRowIndex) {
			containerElement.scrollTop = this.selectedIndex * this.rowHeight;
		}
		else if (this.selectedIndex >= this.topRowIndex + this.numRowsDisplayed) {
			containerElement.scrollTop = (this.selectedIndex - (this.numRowsDisplayed - 1)) * this.rowHeight;
		}
	}

	public onWheel(e: WheelEvent): void {
		e.preventDefault();
		let containerElement = this.elementRef.nativeElement.querySelector(".auto-complete-window");

		if (e.deltaMode === 0) {
			containerElement.scrollTop += e.deltaY;
		}
		else if (e.deltaMode === 1) {
			containerElement.scrollTop += e.deltaY * this.rowHeight;
		}
		else {
			containerElement.scrollTop += e.deltaY * this.rowHeight * this.numRowsDisplayed;
		}
	}

	public onChange(val: string): void {
		this.computeFilteredList(val);
		this.isOpen = val.length > 0 && this.filteredList.length > 0;
	}

	private computeFilteredList(val: string): void {
		if (!val) {
			this.filteredList = this.source;
		}
		else {
			val = val.toLowerCase();
			this.filteredList = this.source.filter(i => this.fuzzyMatch(val, i.value));
			this.renderedRows = this.filteredList.slice(0, this.numRowsDisplayed);
			this.topRowOffset = 0;
			this.selectedIndex = 0;
			this.topRowIndex = 0;
		}
	}

	private fuzzyMatch(s1: string, s2: string) {
		let s1Length = s1.length;
		let s2Length = s2.length;
		if (s1Length > s2Length) return false;
		if (s1Length === s2Length) return s1 === s2;

		outer:
		for (let i = 0, j = 0; i < s1Length; i++) {
			let s1Char = s1.charCodeAt(i);

			while (j < s2Length)
				if (s2.charCodeAt(j++) === s1Char)
					continue outer;

			return false;
		}

		return true;
	}
}