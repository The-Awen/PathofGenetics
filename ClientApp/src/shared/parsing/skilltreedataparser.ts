import * as Immutable from "immutable";
import { SkillTree, SkillTreeImage, ImageType, ClassSpec, AscendancyClassSpec, NodeType, Node, NodeDetail, GroupType, Group, Connection } from "state/tree-model";
import { Point, Size } from "shared/geometry";
import { ParsingConstants, ImageParser } from "shared/parsing";

export class SkillTreeDataParser {
	private imageParser: ImageParser;

	public constructor(private _skillTreeData: any, private _ascendancyClassData: any) {
		this.imageParser = new ImageParser(_skillTreeData);
	}

	public Parse(): SkillTree {
		let skillTree: SkillTree = new SkillTree();
		skillTree.ClassSpecs = this.ParseClassSpecs();
		skillTree.Groups = this.ParseGroups();
		skillTree.Nodes = Immutable.List(this.ParseNodes(skillTree));
		skillTree.Connections = this.ParseConnections(skillTree);
		skillTree.Location = new Point(this._skillTreeData.min_x, this._skillTreeData.min_y);
		skillTree.Size = new Size(this._skillTreeData.max_x - this._skillTreeData.min_x, this._skillTreeData.max_y - this._skillTreeData.min_y);
		skillTree.Assets = Immutable.Map<string, SkillTreeImage>();

		let assets = Immutable.Map<string, any>(this._skillTreeData.assets);

		let assetUrls = assets.valueSeq()
			.map(v => v[ParsingConstants.highestResolutionZoomFactor])
			.filter(v => v !== undefined)
			.filter(x => x !== null && x.length > 0)
			.toList();

		let groupsAndNodesImages = skillTree.Nodes
			.flatMap(n => n.ImagesForState.valueSeq()).flatMap(i => i)
			.concat(skillTree.Groups.flatMap(g => g.Images))
			.filter(i => i.Url.length > 0);

		let assetImages = assetUrls
			.map(url => { let i = new SkillTreeImage(); i.Url = url; i.Type = ImageType.File; return i; })
			.valueSeq();

		assetImages.forEach(i => {
			let assetName = assets.findKey(v => v[ParsingConstants.highestResolutionZoomFactor] === i.Url);
			skillTree.Assets = skillTree.Assets.set(assetName, i);
		});

		groupsAndNodesImages.concat(assetImages).forEach(i => i.LoadImage());
		this.translateAscendancyGroupsAndNodes(skillTree);
		return skillTree;
	}

	private ParseClassSpecs(): Immutable.List<ClassSpec> {
		let result = Immutable.List<ClassSpec>();

		for (let classId in this._ascendancyClassData) {
			let classSpec = new ClassSpec();
			classSpec.BaseClassId = parseInt(classId);
			classSpec.BaseClassName = this._ascendancyClassData[classId].name;

			for (let subclassId in this._ascendancyClassData[classId].classes) {
				let subclassSpec = new AscendancyClassSpec();
				subclassSpec.Id = parseInt(subclassId);
				subclassSpec.Name = this._ascendancyClassData[classId].classes[subclassId].name;
				subclassSpec.DisplayName = this._ascendancyClassData[classId].classes[subclassId].displayName;

				classSpec.SubClasses = classSpec.SubClasses.concat(subclassSpec).toList();
			}

			result = result.concat(classSpec).toList();
		}

		return result;
	}

	private DetermineNodeType(nodeData: any): NodeType {
		if (nodeData["isJewelSocket"]) return NodeType.Jewel;
		if (nodeData.m) return NodeType.Mastery;
		if (nodeData.ks) return NodeType.Keystone;
		if (nodeData.not) return NodeType.Notable;
		if (this._skillTreeData.root.out.indexOf(nodeData.id) !== -1) return NodeType.Class;
		return NodeType.Simple;
	}

	private ParseNodes(skillTree: SkillTree): Array<Node> {
		let nodes = new Array<Node>();

		for (let nodeData of this._skillTreeData.nodes) {
			let group = skillTree.Groups.find(g => g.Id === <number>nodeData.g);
			let radius = ParsingConstants.SkillDistancesFromGroupCenter[nodeData.o];
			let radian = 2 * Math.PI * nodeData.oidx / ParsingConstants.MaxNumSkillsInGroupForDistance[nodeData.o];
			let x = group.Location.X - (radius * Math.sin(-radian));
			let y = group.Location.Y - (radius * Math.cos(-radian));
			let nodeType = this.DetermineNodeType(nodeData);

			let nodeModel = new Node();
			nodeModel.Id = nodeData.id;
			nodeModel.Group = group;
			nodeModel.CenterPoint = new Point(x, y);
			nodeModel.Radius = radius;
			nodeModel.Radian = radian;
			nodeModel.NodeType = nodeType;
			nodeModel.Name = nodeData.dn;
			nodeModel.Details = Immutable.List<NodeDetail>().toArray();
			nodeModel.IsAscendancyStart = nodeData.isAscendancyStart;
			nodeModel.AscendancyName = nodeData.ascendancyName;

			this.ParseNodeDetails(nodeModel, nodeData);

			if (nodeType === NodeType.Jewel) this.imageParser.ParseJewelAssets(nodeData, nodeModel);
			if (nodeType === NodeType.Class) this.imageParser.ParseClassNodeAssets(nodeData, nodeModel);
			if (nodeType === NodeType.Keystone) this.imageParser.ParseKeystoneNodeAssets(nodeData, nodeModel);
			if (nodeType === NodeType.Mastery) this.imageParser.ParseMasteryNodeAssets(nodeData, nodeModel);
			if (nodeType === NodeType.Notable) this.imageParser.ParseNotableNodeAssets(nodeData, nodeModel);
			if (nodeType === NodeType.Simple) this.imageParser.ParseSimpleNodeAssets(nodeData, nodeModel);

			nodes.push(nodeModel);
		}

		return nodes;
	}

	private translateAscendancyGroupsAndNodes(skillTree: SkillTree) {
		skillTree.Groups.filter(g => g.GroupType === GroupType.Ascendancy).forEach(g => {
			let nodesInGroup = skillTree.Nodes.filter(n => n.Group.Id === g.Id);
			let subclassName = nodesInGroup.first().AscendancyName;
			let ascendancyStartNode = skillTree.Nodes.find(n => n.IsAscendancyStart && n.AscendancyName === subclassName);
			let translateXAmount = g.Location.X - ascendancyStartNode.CenterPoint.X;
			let translateYAmount = g.Location.Y - ascendancyStartNode.CenterPoint.Y;

			let imagePoint = skillTree.CalculateAscendancyClassCenterPoint(subclassName);
			g.Location = new Point(imagePoint.X + translateXAmount, imagePoint.Y + translateYAmount);
		});

		skillTree.Nodes.filter(n => n.AscendancyName !== null).forEach(n => {
			n.CenterPoint.X = n.Group.Location.X - (n.Radius * Math.sin(-n.Radian));
			n.CenterPoint.Y = n.Group.Location.Y - (n.Radius * Math.cos(-n.Radian));
			return true;
		});
	};

	private ParseNodeDetails(node: Node, nodeData: any): void {
		let textDetails = nodeData.sd;

		if (node.NodeType === NodeType.Class) {
			let internalClassName = ParsingConstants.NodeIdToClass[node.Id];
			let classIndex = ParsingConstants.ClassNameToIdentifier[internalClassName];
			let classAttributes = this._skillTreeData.characterData[classIndex];

			textDetails = [];
			textDetails.push(classAttributes.base_str + " Base Strength");
			textDetails.push(classAttributes.base_dex + " Base Dexterity");
			textDetails.push(classAttributes.base_int + " Base Intelligence");
		}
		else if (node.NodeType === NodeType.Jewel) {
			textDetails = ["+1 jewel sockets"];
		}
		else if (node.Name === "Passive Point") {
			textDetails = ["+1 passive points"];
		}

		for (let i = 0; i < textDetails.length; i++) {
			node.Details.push(this.ParseNodeDetail(node, textDetails[i]));
		}
	}

	private ParseNodeDetail(node: Node, text: string): NodeDetail {
		let category = "misc";
		let lowercaseText = text.toLowerCase();
		let keywords = ParsingConstants.KeywordToCategoryMapping.keySeq();
		let matchingKeyword = keywords.find(keyword => lowercaseText.indexOf(keyword) !== -1);
		if (matchingKeyword) category = ParsingConstants.KeywordToCategoryMapping.get(matchingKeyword);
		if (node.NodeType === NodeType.Keystone) category = "keystonejewel";

		let amount = 0;
		let numberRegex = /\d+\.*\d*/;
		let numberMatches = numberRegex.exec(text);
		if (numberMatches && numberMatches.length > 0) amount = parseFloat(numberMatches[0]);

		let detail = new NodeDetail();
		detail.Text = text;
		detail.Amount = amount;
		detail.Category = category;
		detail.TemplatedText = text.replace(numberRegex, "#");
		detail.Keyword = matchingKeyword;

		return detail;
	}

	private ParseGroups(): Immutable.List<Group> {
		let groups = new Array<Group>();
		let allNodes = Immutable.List<any>(this._skillTreeData.nodes);

		for (let index in this._skillTreeData.groups) {
			let g = this._skillTreeData.groups[index];

			if (g.n.length === 0) continue;

			let nodeInGroupId = Immutable.List<number>(g.n).first();
			let nodeInGroup = allNodes.find(n => n.id === nodeInGroupId);

			let group = new Group();
			group.Id = parseInt(index);
			group.Location = new Point(g.x, g.y);
			group.GroupType = nodeInGroup["ascendancyName"] ? GroupType.Ascendancy : GroupType.Normal;
			group.Images = this.imageParser.ParseGroupBackground(g);
			groups.push(group);
		}

		return Immutable.List(groups);
	}

	private ParseConnections(skillTree: SkillTree): Immutable.List<Connection> {
		let allConnections = new Array<Connection>();

		for (let node of this._skillTreeData.nodes) {
			let connectionIds = Immutable.List<number>(node.out);
			let from = skillTree.GetNodeById(node.id);
			let to = skillTree.GetNodesByIds(connectionIds);

			to.forEach(cn => from.ConnectedNodes = from.ConnectedNodes.push(cn));
			to.forEach(toNode => toNode.ConnectedNodes = toNode.ConnectedNodes.push(from));
			to.map(n => new Connection(from, n)).forEach(c => allConnections.push(c));
		}

		return Immutable.List(allConnections);
	}
}
