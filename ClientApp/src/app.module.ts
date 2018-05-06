import { NgModule, Injectable } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { BrowserModule } from "@angular/platform-browser";
import { StoreModule } from "@ngrx/store";
import { App, COMPONENT_DIRECTIVES, SkillTree, Stats, Gems, ItemBank, Loadouts } from "components";
import { appStateReducer, StateStore } from "state";
import { RouterModule, Routes, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs";

@Injectable()
export class LoadingRouteGuard implements CanActivate {
	constructor(private store: StateStore) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> {
		return this.store.select(s => s.uiState.loadingComplete).filter(c => c);
	}
}

const appRoutes: Routes = [
	{
		path: "", canActivate: [LoadingRouteGuard], children: [
			{ path: "skill-tree", component: SkillTree, data: { name: "skill-tree", title: "Tree" } },
			//{ path: "item-bank", component: ItemBank, data: { name: "item-bank", title: "Item Bank" } },
			{ path: "gems", component: Gems, data: { name: "gems", title: "Gem Sets" } },
			//{ path: "loadouts", component: Loadouts, data: { name: "loadouts", title: "Loadouts" } },
			{ path: "stats", component: Stats, data: { name: "stats", title: "Stats" } },
			{ path: "", redirectTo: "/skill-tree", pathMatch: "full" },
			{ path: "**", redirectTo: "/skill-tree", pathMatch: "full" }
		]
	}];

@NgModule({
	bootstrap: [App],
	declarations: [COMPONENT_DIRECTIVES],
	imports: [
		BrowserModule,
		FormsModule,
		HttpModule,
		StoreModule.provideStore(appStateReducer),
		RouterModule.forRoot(appRoutes)
	],
	providers: [StateStore, LoadingRouteGuard]
})
export class AppModule { }
