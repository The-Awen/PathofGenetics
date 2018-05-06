import * as Rx from "rxjs/Rx";
import { Size, Point } from "shared/geometry";

export class Browser
{
	public WindowSize : Rx.Observable<Size> = Rx.Observable.create(observer =>
	{
		observer.next(new Size(window.innerWidth, window.innerHeight));

		var resizeListener = (event : UIEvent) =>
		{
			var windowRef = <any> event.target;
			observer.next(new Size(windowRef.innerWidth, windowRef.innerHeight));
		}

		window.addEventListener("resize", resizeListener)

		return () => window.removeEventListener("resize", resizeListener);
	});

	public OnHashChange : Rx.Observable<HashChangeEvent> = Rx.Observable.fromEvent<HashChangeEvent>(window, "hashchange");

	public GlobalMouseMove : Rx.Observable<Point> =
		Rx.Observable.fromEvent<MouseEvent>(window, "mousemove").merge(
		Rx.Observable.fromEvent<MouseEvent>(window, "touchmove"))
			.map(e => new Point(e.pageX, e.pageY));

	public GlobalMouseUp : Rx.Observable<Point> =
		Rx.Observable.fromEvent<MouseEvent>(window, "mouseup").merge(
		Rx.Observable.fromEvent<MouseEvent>(window, "touchend"))
			.map(e => new Point(e.pageX, e.pageY));
}
