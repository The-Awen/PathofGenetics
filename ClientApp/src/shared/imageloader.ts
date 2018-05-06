import * as Immutable from "immutable";
import * as URI from "urijs";
import { images } from "modules/images";

console.dir(images)
export class ImageLoader {
	private static ElementCache: Immutable.Map<string, HTMLImageElement> = Immutable.Map<string, HTMLImageElement>();

	public static FillCache(): Promise<void> {
		let promises = images.keys().map(imageFileName => new Promise<void>(resolve => {
			var url = URI(imageFileName);
			var sprite = new Image();
			sprite.onload = (e) => {
				ImageLoader.ElementCache = ImageLoader.ElementCache.set(url.filename(), sprite);
				resolve();
			};
			sprite.src = images(imageFileName);
		}));

		return Promise.all(promises).then(() => Promise.resolve());
	}

	public static LoadSingle(urlToLoad: string): HTMLImageElement {
		var url = URI(urlToLoad);
		var fileName = url.filename();
		if (ImageLoader.ElementCache.has(fileName)) return ImageLoader.ElementCache.get(fileName);
		return ImageLoader.ElementCache.get("NoImage.png");
	}
}
