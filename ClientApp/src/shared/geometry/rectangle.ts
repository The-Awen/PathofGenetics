import { Point } from "./";

export class Rectangle {
	public constructor(public X: number, public Y: number, public Width: number, public Height: number) {

	}

	public IsPointInside(p: Point): boolean {
		return p.X > this.X && p.X < this.Width + this.X && p.Y > this.Y && p.Y < this.Height + this.Y;
	}
}