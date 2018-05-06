import { ItemFactory } from "state/items-state";
import { Component } from "@angular/core";
import { Browser } from "shared/browser";
import { Size } from "shared/geometry";
import { ImageLoader } from "shared/imageloader";
import { ParsingConstants } from "shared/parsing/parsingconstants";
import { SkillTreeDataParser } from "shared/parsing/skilltreedataparser";
import { TreeStateOperations } from "shared/services/skill-tree/skill-tree.service";
import { NodeStateFactory, StateStore } from "state";
import { Router, ActivatedRouteSnapshot, ActivatedRoute, Route, NavigationStart } from "@angular/router";
import { ascendancyData, skillTreeData } from "modules/data";

@Component({
	selector: "poe-skill-tree-app",
	templateUrl: "app.component.html",
	styleUrls: ["app.component.scss"],
	providers: [Browser]
})
export class App {
	private windowSize: Size;
	private routes: Route[];

	public constructor(private browser: Browser, private store: StateStore, private router: Router, private activatedRoute: ActivatedRoute) {
		this.browser.WindowSize.subscribe(size => this.windowSize = size);
		this.routes = this.router.config[0].children.filter(r => r["data"] !== undefined);
	}

	public ngOnInit() {
		ImageLoader.FillCache().then(() => {
			ParsingConstants.Configure(skillTreeData);
			let tree = new SkillTreeDataParser(skillTreeData, ascendancyData).Parse();
			this.store.update(appState => appState.set("treeModel", tree));
			this.store.update(appState => appState.setIn(["itemState", "bank"], appState.itemState.bank.push(ItemFactory())));
			this.store.update(appState => TreeStateOperations.createNewTreeState(appState));
			this.store.update(s => s.setIn(["uiState", "loadingComplete"], true));
		});
	}
}
