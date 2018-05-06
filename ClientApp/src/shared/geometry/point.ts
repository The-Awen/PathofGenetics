export class Point {
	public constructor(public X: number, public Y: number) {

	}

	public AreSame(otherPoint: Point): boolean {
		return this.X === otherPoint.X && this.Y === otherPoint.Y;
	}
}