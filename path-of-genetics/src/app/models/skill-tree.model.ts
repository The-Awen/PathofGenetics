import { AppState } from "../states/app.state"; 

export class SkillTree {
	public Nodes: Array<Node>;
	public Connections: Array<Connection>;
	public Location: Point;
	public Size: Size;
	public Groups: Array<Group>;
	public Assets: Map<string, SkillTreeImage>;
	public ClassSpecs: Array<ClassSpec>;

	public constructor() {
		this.Assets = Map<string, SkillTreeImage>();
		this.ClassSpecs = Array<ClassSpec>();
	}

	public AscendancyClassImage(appState: AppState): SkillTreeImage {
		return this.Assets.get("Classes" + this.SelectedSubClass(appState).Name);
	}

	public SelectedSubClass(appState: AppStateRecord): AscendancyClassSpec {
		return this.SelectedClass(appState).SubClasses.find(c => c.Id === appState.treeStates.get(appState.uiState.listSelectionIndex).selectedSubClass);
	}

	public SelectedClass(appState: AppStateRecord): ClassSpec {
		return this.ClassSpecs.find(c => c.BaseClassId === appState.treeStates.get(appState.uiState.listSelectionIndex).selectedClass);
	}

	public GetNodeById(id: number): Node {
		return this.Nodes.find(n => n.Id === id);
	}

	public GetNodesByIds(ids: Immutable.List<number>): Immutable.List<Node> {
		return ids.map(id => this.GetNodeById(id)).toList();
	}

	public CalculateAscendancyClassCenterPoint(subclassName: string): Point {
		let classSpec = this.ClassSpecs.find(c => c.SubClasses.count(sc => sc.Name === subclassName) > 0);
		let classInternalName = ParsingConstants.ClassIdentifierToName[classSpec.BaseClassId];
		let classNodeId = ParsingConstants.ClassToNodeId[classInternalName];
		let classNode = this.Nodes.find(cn => cn.Id === classNodeId);
		let isCenterClass = Math.abs(classNode.Group.Location.X) < 10.0 && Math.abs(classNode.Group.Location.Y) < 10.0;
		let rotationAmount = 0;

		if (!isCenterClass) {
			let distToCenter = Math.sqrt(classNode.Group.Location.X * classNode.Group.Location.X + classNode.Group.Location.Y * classNode.Group.Location.Y);
			rotationAmount = Math.atan2(classNode.Group.Location.X / distToCenter, -classNode.Group.Location.Y / distToCenter);
		}

		let image = this.Assets.get("Classes" + subclassName);
		let imageCX = classNode.Group.Location.X + (270 + image.Size.Width / 2) * Math.cos(rotationAmount + Math.PI / 2);
		let imageCY = classNode.Group.Location.Y + (270 + image.Size.Height / 2) * Math.sin(rotationAmount + Math.PI / 2);
		return new Point(imageCX, imageCY);
	}

	public IsPointUnderAscendancyBackground(appState: AppState, p: Point): boolean {
		let centerPoint = this.CalculateAscendancyClassCenterPoint(this.SelectedSubClass(appState).Name);
		let distanceAway = Math.sqrt(Math.pow(p.X - centerPoint.X, 2) + Math.pow(p.Y - centerPoint.Y, 2));
		let image = this.Assets.get("Classes" + this.SelectedSubClass(appState).Name);
		let radius = image.Size.Width / 2;
		return distanceAway < radius;
	}
}
