import { TreeStateOperations } from "shared/services/skill-tree/skill-tree.service";
import { AppStateRecord } from '../../../state/app-state';
import { NodeStateFactory, TreeStateRecord } from '../../../state/tree-state';
import { SkillTreeGraphRenderer } from './treerenderer.service';
import { Component, NgZone } from '@angular/core';
import * as Immutable from 'immutable';
import * as Rx from 'rxjs/Rx';
import { Browser } from 'shared/browser';
import { Point, Rectangle } from 'shared/geometry';
import { ParsingConstants } from 'shared/parsing';
import { Node, StateStore, TreeStateFactory } from 'state';
import { Observable } from "rxjs/Rx";

@Component({
	selector: "poe-tree-view",
	templateUrl: "skill-tree.component.html",
	styleUrls: ["skill-tree.component.scss"]
})
export class SkillTree {
	public MouseWheels: Rx.Observable<any>;
	public LocalMouseMoves: Rx.Observable<Point>;
	public LocalMouseUps: Rx.Observable<Point>;
	public LocalMouseDowns: Rx.Observable<Point>;
	public treeStateFactory = TreeStateFactory;
	private graphRenderer: SkillTreeGraphRenderer;
	private canvasElement: HTMLCanvasElement;
	public lastMouseCoordinate: Point;
	private dragging: boolean;

	public constructor(private browser: Browser, private zone: NgZone, private store: StateStore) {
		this.LocalMouseDowns = new Rx.Subject<MouseEvent>().map(e => new Point(e.offsetX, e.offsetY));
		this.LocalMouseUps = new Rx.Subject<MouseEvent>().map(e => new Point(e.offsetX, e.offsetY));
		this.MouseWheels = new Rx.Subject<MouseEvent>();
		this.LocalMouseMoves = new Rx.Subject<MouseEvent>().map(e => new Point(e.offsetX, e.offsetY));
	}

	public getClassName(item: TreeStateRecord): string {
		return this.store.currentState.treeModel.ClassSpecs.find(c => c.BaseClassId === item.selectedClass).BaseClassName;
	}

	public getAscendancyClassName(item: TreeStateRecord): string {
		let baseClass = this.store.currentState.treeModel.ClassSpecs.find(c => c.BaseClassId === item.selectedClass);
		return baseClass.SubClasses.find(c => c.Id === item.selectedSubClass).DisplayName;
	}

	public createNewTreeState(appState: AppStateRecord): AppStateRecord {
		return TreeStateOperations.createNewTreeState(appState);
	}

	public ngAfterViewInit(): void {
		this.browser.OnHashChange.subscribe(e => this.store.update(appState => TreeStateOperations.importBuild(appState, appState.uiState.listSelectionIndex, e.newURL)));
		this.store.select(s => s.treeStates.get(s.uiState.listSelectionIndex).hash).skip(1).subscribe(hash => window.location.hash = hash);

		Rx.Observable.fromEvent<any>(document, "touchmove")
			.filter(e => e.target.tagName.toLowerCase() == "canvas")
			.subscribe(e => e.preventDefault());

		this.canvasElement = <HTMLCanvasElement>document.getElementById("skillTreeCanvas");
		this.graphRenderer = new SkillTreeGraphRenderer(this.canvasElement.getContext("2d"), this.store);
		this.store.select(s => s.treeStates.get(s.uiState.listSelectionIndex).selectedClass).subscribe(c => this.centerOnActiveClass());
		this.browser.WindowSize.subscribe(s => this.recomputeSize());
		this.dragEventSequence.subscribe((p: Point) => this.graphRenderer.slideBy(p.X, p.Y));

		this.LocalMouseDowns.subscribe(e => this.dragging = true);
		this.browser.GlobalMouseUp.subscribe(e => this.dragging = false);

		this.clickEventSequence.subscribe((clickPoint: Point) => {
			var clickedNodes = this.graphRenderer.topNodeAt(clickPoint);
			if (clickedNodes.isEmpty()) return;
			this.store.update(s => TreeStateOperations.toggleNodes(s, s.uiState.listSelectionIndex, clickedNodes));
		});

		this.nodeHoverChangeSequence(this.graphRenderer).subscribe((changeSets: Array<Immutable.List<Node>>) => {
			this.store.update(appState => {
				appState = TreeStateOperations.clearHighlighting(appState, appState.uiState.listSelectionIndex);
				appState = appState.setIn(["uiState", "skillTree", "hoveredNodeIds"], changeSets[1].map(n => n.Id));
				if (!changeSets[1].isEmpty()) appState = TreeStateOperations.highlightPathToNode(appState, appState.uiState.listSelectionIndex, changeSets[1]);
				return appState;
			});
		});

		this.MouseWheels.subscribe((e: any) => {
			var cursorPosition = new Point(e.offsetX, e.offsetY);
			e["deltaY"] < 0 ? this.graphRenderer.incrementZoomLevel(cursorPosition) : this.graphRenderer.decrementZoomlevel(cursorPosition);
		});

		this.LocalMouseMoves.subscribe(p => this.lastMouseCoordinate = p);
	}

	private recomputeSize(): void {
		this.zone.onStable.first().subscribe(() => {
			this.canvasElement.setAttribute("width", this.canvasElement.getBoundingClientRect().width.toString());
			this.canvasElement.setAttribute("height", this.canvasElement.getBoundingClientRect().height.toString());
			this.graphRenderer.invalidate();
		});
	}

	private centerOnActiveClass(): void {
		let appState = this.store.currentState;
		let className = ParsingConstants.ClassIdentifierToName[appState.treeStates.get(appState.uiState.listSelectionIndex).selectedClass];
		let classNodeId = ParsingConstants.ClassToNodeId[className];
		let classNode = this.store.currentState.treeModel.Nodes.find(n => n.Id == classNodeId);
		this.graphRenderer.centerAtPoint(classNode.CenterPoint);
	}

	private nodeHoverChangeSequence(renderer: SkillTreeGraphRenderer): Rx.Observable<Array<Immutable.List<Node>>> {
		return this.LocalMouseMoves
			.filter(p => !this.dragging)
			.map(p => renderer.topNodeAt(p))
			.bufferCount(2, 1)
			.filter(change => change.length > 1)
			.filter(change => !change[0].equals(change[1]));
	}

	private get clickEventSequence(): Rx.Observable<any> {
		return this.LocalMouseDowns.flatMap(downPoint =>
			this.LocalMouseUps
				.filter(upPoint => new Rectangle(upPoint.X - 5, upPoint.Y - 5, 10, 10).IsPointInside(downPoint))
				.first());
	}

	private get dragEventSequence(): Rx.Observable<any> {
		return this.LocalMouseDowns.flatMap(downPoint =>
			this.browser.GlobalMouseMove.takeUntil(this.browser.GlobalMouseUp)
				.bufferCount(2, 1)
				.filter(allPoints => allPoints.length > 1)
				.map(allPoints => new Point(allPoints[allPoints.length - 1].X - allPoints[0].X, allPoints[allPoints.length - 1].Y - allPoints[0].Y)));
	}
}
