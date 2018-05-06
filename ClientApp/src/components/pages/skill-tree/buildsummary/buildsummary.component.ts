import { Component, Input, EventEmitter, Output } from "@angular/core";
import * as Immutable from 'immutable';
import { StateStore } from "state";
import { NodeStateEnum, SkillTree, AscendancyClassSpec, ClassSpec } from "state/tree-model";
import { TreeStateOperations } from "shared/services/skill-tree/skill-tree.service";
import { SelectItem } from "components/widgets/select-field/select-item";

@Component({
	selector: "poe-build-summary",
	templateUrl: "buildsummary.component.html",
	styleUrls: ["buildsummary.component.scss"]
})
export class BuildSummary {
	private treeModel: SkillTree;
	private categories: Array<any>;
	private selectedClassId: string;
	private selectedSubClassId: string;
	private pointsSpent: number;
	private ascendancyPointsSpent: number;
	private availableSubClasses: Immutable.Iterable<number, SelectItem>;
	private availableClasses: Immutable.Iterable<number, SelectItem>;

	public constructor(private store: StateStore) {
		this.availableSubClasses = Immutable.List<SelectItem>();
		this.availableClasses = Immutable.List<SelectItem>();
	}

	public ngAfterViewInit(): void {
		this.store.select(s => s.treeModel).filter(s => s != null).subscribe(s => this.treeModel = s);
		this.store.select(s => s.treeStates.get(s.uiState.listSelectionIndex).nodeStates).filter(s => s.count() > 0).subscribe(s => this.OnNodesChanged());

		this.store.select(s => s.treeModel.ClassSpecs).subscribe(classes => {
			this.availableClasses = classes.map(c => ({ text: c.BaseClassName, value: c.BaseClassId.toString() }));
		});

		this.store.select(s => s.treeStates.get(s.uiState.listSelectionIndex).pointsSpent).subscribe(s => {
			this.pointsSpent = s;
		});

		this.store.select(s => s.treeStates.get(s.uiState.listSelectionIndex).ascendancyPointsSpent).subscribe(s => {
			this.ascendancyPointsSpent = s;
		});

		this.store.select(s => s.treeStates.get(s.uiState.listSelectionIndex).selectedClass).subscribe(classId => {
			this.selectedClassId = classId.toString();
			this.availableSubClasses = this.store.currentState.treeModel.ClassSpecs
				.find(c => c.BaseClassId === classId)
				.SubClasses
				.map(c => ({ text: c.DisplayName, value: c.Id.toString() }));
		});

		this.store.select(s => s.treeStates.get(s.uiState.listSelectionIndex).selectedSubClass).subscribe(classId => {
			this.selectedSubClassId = classId.toString();
		});
	}

	private onClassChanged(newClassId: string): void {
		this.store.update(appState => TreeStateOperations.activateClass(appState, appState.uiState.listSelectionIndex, parseInt(newClassId)));
	}

	private onSubClassChanged(newClassId: string): void {
		this.store.update(appState => TreeStateOperations.activateSubClass(appState, appState.uiState.listSelectionIndex, parseInt(newClassId)));
	}

	private OnNodesChanged(): void {
		var categoryKeys = this.treeModel.Nodes
			.filter(n => this.store.currentState.getIn(["treeStates", this.store.currentState.uiState.listSelectionIndex, "nodeStates", n.Id, "activeState"]) == NodeStateEnum.Active)
			.flatMap(n => Immutable.List(n.Details))
			.groupBy(n => n.Category)
			.map(g => g.first().Category)
			.sort((x, y) => this.CategoryDisplayMap.keySeq().indexOf(x) - this.CategoryDisplayMap.keySeq().indexOf(y));

		this.categories = categoryKeys.map(categoryKey => {
			var category = new Object();
			category["name"] = this.CategoryDisplayMap.get(categoryKey);

			category["items"] = this.treeModel.Nodes
				.filter(n => this.store.currentState.getIn(["treeStates", this.store.currentState.uiState.listSelectionIndex, "nodeStates", n.Id, "activeState"]) == NodeStateEnum.Active)
				.flatMap(n => Immutable.List(n.Details))
				.filter(d => d.Category == categoryKey)
				.groupBy(n => n.TemplatedText)
				.map<{ amount: number, templatedText: string, keyword: string }>((v, k) => <any>
					{
						amount: v.reduce((acc, d) => acc + d.Amount, 0),
						templatedText: k,
						keyword: v.first().Keyword
					})
				.groupBy(subgroup => subgroup.keyword)
				.flatMap(keywordGroup => keywordGroup.sortBy(sg => sg.amount))
				.reverse()
				.map(g => g.templatedText.replace(/#/, g.amount.toFixed(1).replace(/\.0$/, "")))
				.toArray();

			return category;
		}).toArray();
	}

	public CategoryDisplayMap = Immutable.OrderedMap<string, string>()
		.set("class", "Class")
		.set("keystonejewel", "Keystones / Jewels")
		.set("stat", "Stats")
		.set("lifemanaes", "Life/Mana/ES")
		.set("flask", "Flasks")
		.set("defense", "Defense")
		.set("elemental", "Elemental")
		.set("chaos", "Chaos")
		.set("physical", "Physical")
		.set("melee", "Melee")
		.set("attack", "Attack")
		.set("spell", "Spell")
		.set("proj", "Projectile")
		.set("damage", "Damage")
		.set("crit", "Crit")
		.set("totem", "Totem")
		.set("trapandmine", "Traps & Mines")
		.set("curse", "Curse")
		.set("minion", "Minion")
		.set("aura", "Auras")
		.set("leech", "Leech")
		.set("misc", "Miscellaneous");
}
