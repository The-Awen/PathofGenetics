import * as Rx from "rxjs/Rx";

export class Request {
	constructor(
		public url: string,
		public method: string,
		public body: string = "") {

	}
}

export class Response {
	constructor(
		public request: Request,
		public bytesLoaded: number,
		public totalBytes: number,
		public body: string,
		public statusCode: number) {

	}

	public toJson(): any {
		return JSON.parse(this.body);
	}
}

export class Http {
	public static request(request: Request): Rx.Subject<Response> {
		var subject = new Rx.Subject<Response>();
		var xhrRequest = new XMLHttpRequest();
		xhrRequest.open(request.method, request.url);

		xhrRequest.onload = e => {
			if (xhrRequest.status < 200 || xhrRequest.status >= 300) {
				subject.error(xhrRequest);
			}
			else {
				subject.next(new Response(request, -1, -1, xhrRequest.responseText, xhrRequest.status));
				subject.complete();
			}
		}

		xhrRequest.onerror = e => subject.error(e);
		xhrRequest.onprogress = e => subject.next(new Response(request, e.loaded, e.total, null, -1));

		if (request.method == "GET" || request.method == "DELETE") xhrRequest.send();
		else xhrRequest.send(request.body);

		return subject;
	}
}
