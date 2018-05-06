import { Component, OnInit } from '@angular/core';
import { Subject, Observable } from "rxjs";

@Component({ 
  selector: 'pog-skill-tree',
  templateUrl: './skill-tree.component.html',
  styleUrls: ['./skill-tree.component.css']
})
export class SkillTreeComponent implements OnInit {
  public MouseWheels: Observable<any>;
	public LocalMouseMoves: Observable<Point>;
	public LocalMouseUps: Observable<Point>;
	public LocalMouseDowns: Observable<Point>;
	public treeStateFactory = TreeStateFactory;
	private graphRenderer: SkillTreeGraphRenderer;
	private canvasElement: HTMLCanvasElement;
	public lastMouseCoordinate: Point;
	private dragging: boolean;

  constructor() { }

  ngOnInit() {
  }

}
