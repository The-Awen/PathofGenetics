import { TreeStateRecord } from '../../../state/tree-state';
import { Point, Rectangle } from 'shared/geometry';
import { Tuple } from 'shared/tuple';
import { AppStateRecord, NodeState, NodeStateRecord, StateStore, TreeState } from 'state';
import { Connection, Group, GroupType, ImageLayer, ImageType, Node, NodeType, SkillTree, SkillTreeImage } from 'state/tree-model';
import * as Immutable from 'immutable';

export class SkillTreeGraphRenderer {
	private nodeIdMap: { [key: number]: Node };
	private nodeStateMap: { [key: number]: NodeStateRecord };
	private normalGroups: Immutable.Iterable<number, Group>;
	private passiveTreeNodes: Immutable.Iterable<number, Node>;
	private currentAppState: AppStateRecord;
	private zoomFactor: number;
	private screenOffsetX: number;
	private screenOffsetY: number;
	private invalidated: boolean;
	private skillTree: SkillTree;
	private skillConnections: Connection[];

	private static jewelRadii: Array<number> = [800, 1200, 1500];
	private static jewelCircleThickness = 10;

	public constructor(private context: CanvasRenderingContext2D, private store: StateStore) {
		this.zoomFactor = .2;
		this.screenOffsetX = 0;
		this.screenOffsetY = 0;
		this.skillTree = this.store.currentState.treeModel;

		this.store.select(s => s).subscribe(s => this.currentAppState = s);
		this.store.select(s => s.treeStates.get(s.uiState.listSelectionIndex).nodeStates).subscribe(s => this.nodeStateMap = s.toObject());
		this.store.select(s => s.treeStates.get(s.uiState.listSelectionIndex)).subscribe(s => this.invalidate());
		this.store.select(s => s.uiState.skillTree.hoveredNodeIds).subscribe(s => this.invalidate());

		this.store.select(s => s.treeModel).subscribe(s => {
			this.skillConnections = s.Connections.filter(c => c.A.IsSkill && c.B.IsSkill && c.A.AscendancyName == null).toArray();
			this.passiveTreeNodes = this.skillTree.Nodes.filter(n => n.AscendancyName == null);
			this.normalGroups = this.skillTree.Groups.filter(g => g.GroupType == GroupType.Normal);
			this.nodeIdMap = {};
			this.skillTree.Nodes.forEach(n => this.nodeIdMap[n.Id] = n);
		});
	}

	public centerAtPoint(graphPoint: Point): void {
		var centerX = -graphPoint.X * this.zoomFactor;
		var centerY = -graphPoint.Y * this.zoomFactor;
		this.screenOffsetX = centerX + this.context.canvas.width / 2;
		this.screenOffsetY = centerY + this.context.canvas.height / 2;
		this.invalidate();
	}

	public incrementZoomLevel(screenPoint: Point): void {
		if (this.zoomFactor > .3) return;

		var graphPoint = this.convertToGraphPoint(screenPoint);
		this.zoomFactor += .03;
		this.screenOffsetX += -graphPoint.X * .03;
		this.screenOffsetY += -graphPoint.Y * .03;
		this.invalidate();
	}

	public decrementZoomlevel(screenPoint: Point): void {
		if (this.zoomFactor < .1) return;

		var graphPoint = this.convertToGraphPoint(screenPoint);
		this.zoomFactor -= .03;
		this.screenOffsetX += -graphPoint.X * -.03;
		this.screenOffsetY += -graphPoint.Y * -.03;
		this.invalidate();
	}

	public slideBy(xAmount: number, yAmount: number): void {
		this.screenOffsetX += xAmount;
		this.screenOffsetY += yAmount;
		this.invalidate();
	}

	public invalidate(): void {
		if (this.invalidated) return;
		this.invalidated = true;

		requestAnimationFrame(() => {
			this.renderInternal();
			this.invalidated = false;
		});
	}

	private get currentTreeState(): TreeStateRecord {
		return this.store.currentState.treeStates.get(this.store.currentState.uiState.listSelectionIndex);
	}

	public topNodeAt(screenPoint: Point): Immutable.List<Node> {
		var nodesAtPoint = this.nodesAt(screenPoint);

		nodesAtPoint = nodesAtPoint.filter(n => !n.IsAscendancyStart && n.NodeType != NodeType.Mastery).toList();

		if (nodesAtPoint.isEmpty()) return nodesAtPoint;

		if (this.currentTreeState.isAscendancyClassVisible) {
			var subclassName = this.skillTree.SelectedSubClass(this.currentAppState).Name;
			var ascendancyNode = nodesAtPoint.find(n => n.AscendancyName == subclassName);
			if (ascendancyNode != null) return Immutable.List<Node>().concat(ascendancyNode).toList();
			nodesAtPoint = nodesAtPoint.filter(n => !this.skillTree.IsPointUnderAscendancyBackground(this.currentAppState, this.convertToGraphPoint(screenPoint))).toList();
		}

		nodesAtPoint = nodesAtPoint.filter(n => n.AscendancyName == null).toList();

		if (nodesAtPoint.isEmpty()) return nodesAtPoint;

		var smallestNode = nodesAtPoint.sortBy(n => {
			let currentNodeState = this.currentAppState.treeStates.get(this.currentAppState.uiState.listSelectionIndex).nodeStates.get(n.Id).activeState;
			var biggestImage = n.ImagesForState.get(currentNodeState).max(i => i.Size.Height * i.Size.Width);
			return biggestImage.Size.Height * biggestImage.Size.Width;
		}).first();

		return Immutable.List<Node>().concat(smallestNode).toList();
	}

	public nodesAt(screenPoint: Point): Immutable.List<Node> {
		var foundNodes = new Array<Node>(5000);
		var numNodesFound = 0;

		this.skillTree.Nodes.filter(n => !n.ImagesForState.isEmpty()).forEach(n => {
			let currentNodeState = this.currentAppState.treeStates.get(this.currentAppState.uiState.listSelectionIndex).nodeStates.get(n.Id).activeState;
			var nodeIsUnderPoint = n.ImagesForState.get(currentNodeState)
				.some(i => this.createRectangleAroundPoint(n.CenterPoint, i).IsPointInside(screenPoint));

			if (nodeIsUnderPoint) foundNodes[numNodesFound++] = n;
		});

		foundNodes.length = numNodesFound;
		return Immutable.List<Node>(foundNodes);
	}

	private renderInternal(): void {
		this.context.canvas.width = this.context.canvas.width;
		this.renderPassiveTree();
		this.renderAscendancyTree();
	}

	private renderAscendancyTree(): void {
		if (!this.currentTreeState.isAscendancyClassVisible) return;

		var subclassName = this.skillTree.SelectedSubClass(this.currentAppState).Name;
		var centerOfTree = this.skillTree.CalculateAscendancyClassCenterPoint(subclassName);
		var ascendancyNodes = this.skillTree.Nodes.filter(n => n.AscendancyName == subclassName);
		var nodesToRender = this.findNodeImagesToRender(ascendancyNodes);
		var ascendancyTreeConnections = this.skillTree.Connections.filter(c => c.A.AscendancyName != null && c.B.AscendancyName != null && c.A.AscendancyName == subclassName);

		this.renderImage(this.skillTree.AscendancyClassImage(this.currentAppState), this.createRectangleAroundPoint(centerOfTree, this.skillTree.AscendancyClassImage(this.currentAppState)));
		this.renderImagesOnLayer(nodesToRender, ImageLayer.Background);
		this.renderTreeConnections(ascendancyTreeConnections.toArray());
		this.renderImagesOnLayer(nodesToRender, ImageLayer.Icon);
		this.renderImagesOnLayer(nodesToRender, ImageLayer.Frame);
		this.renderSearchHighlighting(ascendancyNodes);
	}

	private renderPassiveTree(): void {
		var allImages = this.findNodeImagesToRender(this.passiveTreeNodes);
		this.renderPassiveTreeGroups();
		this.renderImagesOnLayer(allImages, ImageLayer.Background);
		this.renderTreeConnections(this.skillConnections);
		this.renderImagesOnLayer(allImages, ImageLayer.Icon);
		this.renderImagesOnLayer(allImages, ImageLayer.Frame);
		this.renderSearchHighlighting(this.passiveTreeNodes);
		this.renderJewelRadii();
	}

	private renderPassiveTreeGroups(): void {
		this.normalGroups.forEach(g => {
			g.Images.forEach(i => {
				this.renderImage(i, this.createRectangleAroundPoint(g.Location, i))
			});
		});
	}

	private renderTreeConnections(connections: Connection[]): void {
		var orphanHighlighted = new Array<Connection>(100);
		var activationHighlighted = new Array<Connection>(100);
		var active = new Array<Connection>(100);
		var inactive = new Array<Connection>(100);

		let connectionsOnScreen = connections.filter(connection => {
			var p0 = this.convertToScreenPoint(connection.A.CenterPoint);
			var p1 = this.convertToScreenPoint(connection.B.CenterPoint);

			if (this.isOnScreen(p0) || this.isOnScreen(p1)) {
				let isHighlightedAsOrphan = connection.IsHighlightedAsOrphan(this.nodeStateMap);
				let isActivationHighlighted = connection.IsHighlightedForActivation(this.nodeStateMap);
				let isActive = connection.IsActive(this.nodeStateMap);

				if (isHighlightedAsOrphan) orphanHighlighted.push(connection);
				if (isActivationHighlighted) activationHighlighted.push(connection);
				if (isActive && !isHighlightedAsOrphan) active.push(connection);
				if (!isActive && !isActivationHighlighted) inactive.push(connection);
			}
		});

		if (orphanHighlighted.length > 0) this.renderConnectionType(orphanHighlighted, "rgba(255, 0, 0, .6)", 40 * this.zoomFactor);
		if (activationHighlighted.length > 0) this.renderConnectionType(activationHighlighted, "rgba(0, 255, 0, .6)", 40 * this.zoomFactor);
		if (active.length > 0) this.renderConnectionType(active, "#7d7c03", 30 * this.zoomFactor);
		if (inactive.length > 0) this.renderConnectionType(inactive, "#3D3C1B", 20 * this.zoomFactor);
	}

	private renderJewelRadii(): void {
		let hoveredNodeIds = this.currentAppState.uiState.skillTree.hoveredNodeIds;
		if (hoveredNodeIds.isEmpty()) return;
		var hoveredJewelSockets = this.skillTree.Nodes.filter(n => hoveredNodeIds.contains(n.Id)).filter(n => n.NodeType == NodeType.Jewel);

		hoveredJewelSockets.forEach(n => {
			var screenPoint = this.convertToScreenPoint(n.CenterPoint);

			SkillTreeGraphRenderer.jewelRadii.forEach(radius => {
				this.context.beginPath();
				this.context.arc(screenPoint.X, screenPoint.Y, (radius - SkillTreeGraphRenderer.jewelCircleThickness / 2) * this.zoomFactor, 0, Math.PI * 2);
				this.context.strokeStyle = "rgb(255, 255, 255)";
				this.context.lineWidth = SkillTreeGraphRenderer.jewelCircleThickness * this.zoomFactor;
				this.context.lineCap = "butt";
				this.context.stroke();
			});
		});
	}

	private renderSearchHighlighting(nodes: Immutable.Iterable<number, Node>): void {
		this.currentTreeState.searchResultNodeIds.forEach(id => {
			let n = this.nodeIdMap[id];

			if (n.AscendancyName != null && !this.currentTreeState.isAscendancyClassVisible) return true;

			var largestImage = n.ImagesForState.get(this.nodeStateMap[id].activeState)
				.filter(i => i.Layer == ImageLayer.Icon || i.Layer == ImageLayer.Frame)
				.max(i => i.Type == ImageType.File ? i.Size.Height : i.SpriteSize.Height);

			var rectangle = this.createRectangleAroundPoint(n.CenterPoint, largestImage);
			var center = this.convertToScreenPoint(n.CenterPoint);

			this.context.beginPath();
			this.context.fillStyle = "rgba(192, 0, 0, .5)";
			this.context.arc(center.X, center.Y, rectangle.Height / 1.25, 0, 2 * Math.PI);
			this.context.fill();
			return true;
		});
	}

	private findNodeImagesToRender(nodes: Immutable.Iterable<number, Node>): Array<Tuple<Node, SkillTreeImage>> {
		var allImages = new Array<Tuple<Node, SkillTreeImage>>(5000);
		var numImagesFound = 0;

		nodes.forEach(n => {
			let currentNodeState = this.currentAppState.treeStates.get(this.currentAppState.uiState.listSelectionIndex).nodeStates.get(n.Id).activeState;
			n.ImagesForState.get(currentNodeState).forEach(i => {
				allImages[numImagesFound++] = new Tuple<Node, SkillTreeImage>(n, i);
			});
		});

		allImages.length = numImagesFound;
		return allImages;
	}

	private renderImagesOnLayer(allImages: Array<Tuple<Node, SkillTreeImage>>, layer: ImageLayer) {
		for (var x of allImages) {
			if (x.Item2.Layer == layer) {
				this.renderImage(x.Item2, this.createRectangleAroundPoint(x.Item1.CenterPoint, x.Item2))
			}
		}
	}

	private renderImage(image: SkillTreeImage, r: Rectangle): void {
		var sLoc = image.SpriteLocation;
		var sSize = image.SpriteSize;

		if (r.X + r.Width < 0 || r.Y + r.Height < 0) return;
		if (r.X > this.context.canvas.width) return;
		if (r.Y > this.context.canvas.height) return;

		if (image.RotationInRadians != 0) {
			this.context.save();
			this.context.translate(r.X, r.Y);
			this.context.translate(r.Width / 2, r.Height / 2);
			this.context.rotate(image.RotationInRadians);
			this.context.drawImage(image.Element, sLoc.X, sLoc.Y, sSize.Width, sSize.Height, -r.Width / 2, -r.Height / 2, r.Width, r.Height);
			this.context.restore();
		}
		else {
			this.context.drawImage(image.Element, sLoc.X, sLoc.Y, sSize.Width, sSize.Height, r.X, r.Y, r.Width, r.Height);
		}
	}

	private renderConnectionType(connections: Connection[], color: string, lineWidth: number) {
		this.context.lineCap = "butt";
		this.context.strokeStyle = color;
		this.context.lineWidth = lineWidth;
		this.context.beginPath();
		connections.forEach(c => this.renderConnection(c));
		this.context.stroke();
	}

	private renderConnection(connection: Connection): void {
		var p0 = this.convertToScreenPoint(connection.A.CenterPoint);
		var p1 = this.convertToScreenPoint(connection.B.CenterPoint);

		if (!this.isOnScreen(p0) && !this.isOnScreen(p1)) return;

		if (connection.A.Group.Id == connection.B.Group.Id && connection.A.Radius == connection.B.Radius) {
			var groupCenterX = connection.A.Group.Location.X * this.zoomFactor + this.screenOffsetX;
			var groupCenterY = connection.A.Group.Location.Y * this.zoomFactor + this.screenOffsetY;
			var scaledRadius = connection.A.Radius * this.zoomFactor;
			var startRadian = connection.A.Radian - Math.PI / 2;
			var endRadian = connection.B.Radian - Math.PI / 2;
			var loopsPastStartingPointWhileGoingToTheRight = connection.A.Radian > connection.B.Radian;
			var distanceGoingRight = connection.B.Radian - connection.A.Radian;

			if (loopsPastStartingPointWhileGoingToTheRight) distanceGoingRight = 2 * Math.PI - Math.abs(connection.A.Radian - connection.B.Radian);

			var lessThanHalfWayAroundCircle = distanceGoingRight < Math.PI;

			this.context.moveTo(p0.X, p0.Y);
			this.context.arc(groupCenterX, groupCenterY, scaledRadius, startRadian, endRadian, !lessThanHalfWayAroundCircle);
		}
		else {
			this.context.moveTo(p0.X, p0.Y);
			this.context.lineTo(p1.X, p1.Y);
		}
	}

	private isOnScreen(p: Point): boolean {
		if (p.X < 0 && p.X < 0) return false;
		if (p.X > this.context.canvas.width && p.X > this.context.canvas.width) return false;
		return true;
	}

	private createRectangleAroundPoint(graphPoint: Point, image: SkillTreeImage): Rectangle {
		var center = this.convertToScreenPoint(graphPoint);
		var width = image.Size.Width * this.zoomFactor;
		var height = image.Size.Height * this.zoomFactor;
		var x = (center.X - width / 2) + image.Offset.X * this.zoomFactor;
		var y = (center.Y - height / 2) + image.Offset.Y * this.zoomFactor;
		return new Rectangle(x, y, width, height);
	}

	private convertToScreenPoint(graphPoint: Point): Point {
		var centerX = graphPoint.X * this.zoomFactor + this.screenOffsetX;
		var centerY = graphPoint.Y * this.zoomFactor + this.screenOffsetY;
		return new Point(centerX, centerY);
	}

	private convertToGraphPoint(screenPoint: Point): Point {
		var centerX = (screenPoint.X - this.screenOffsetX) / this.zoomFactor;
		var centerY = (screenPoint.Y - this.screenOffsetY) / this.zoomFactor;
		return new Point(centerX, centerY);
	}
}
