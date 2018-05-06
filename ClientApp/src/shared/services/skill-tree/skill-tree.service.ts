import { Injectable } from "@angular/core";
import { StateStore, AppState, AppStateRecord, TreeStateRecord, TreeStateFactory, NodeStateFactory } from "state";
import { Node, NodeType, NodeStateEnum, SkillTree } from "state/tree-model";
import * as Immutable from "immutable";
import { Tuple } from "shared/tuple";
import { ParsingConstants } from "shared/parsing";

@Injectable()
export class TreeStateOperations {
	public static createNewTreeState(appState: AppStateRecord): AppStateRecord {
		let newTreeState = TreeStateFactory();

		appState.treeModel.Nodes.forEach(n => {
			newTreeState = newTreeState.setIn(["nodeStates", n.Id], NodeStateFactory().set("id", n.Id));
		});

		appState = appState.setIn(["treeStates"], appState.treeStates.push(newTreeState));
		return TreeStateOperations.activateClass(appState, appState.treeStates.count() - 1, 0);
	}

	public static search(appState: AppStateRecord, query: string): AppStateRecord {
		let nodeStates = appState.treeStates.get(appState.uiState.listSelectionIndex).nodeStates;
		let matchingNodeIds = Immutable.List<number>();
		query = query.toLowerCase();

		appState.treeModel.Nodes.filter(n => n.IsSkill).forEach(n => {
			let state = nodeStates.get(n.Id);
			let isMatch = query.length && n.Details.some(d => d.Text.toLowerCase().indexOf(query) !== -1);
			if (isMatch) matchingNodeIds = matchingNodeIds.push(n.Id);
			return true;
		});

		return appState.setIn(["treeStates", appState.uiState.listSelectionIndex, "searchResultNodeIds"], matchingNodeIds);
	}

	public static clearHighlighting(appState: AppStateRecord, treeStateIndex: number): AppStateRecord {
		let nodeStates = appState.treeStates.get(treeStateIndex).nodeStates;

		nodeStates.keySeq().forEach(k => {
			nodeStates = nodeStates.set(k, nodeStates.get(k).set("isHighlighted", false).set("isOrphanHighlighted", false));
			return true;
		});

		return appState.setIn(["treeStates", treeStateIndex, "nodeStates"], nodeStates);
	}

	public static toggleNodes(appState: AppStateRecord, treeStateIndex: number, nodes: Immutable.List<Node>): AppStateRecord {
		appState = this.clearHighlighting(appState, treeStateIndex);

		if (nodes.count(n => n.NodeType === NodeType.Class && appState.treeStates.get(treeStateIndex).nodeStates.get(n.Id).activeState === NodeStateEnum.Active) > 0 && nodes.count() === 1) {
			appState = appState.setIn(["treeStates", treeStateIndex, "isAscendancyClassVisible"], !appState.treeStates.get(appState.uiState.listSelectionIndex).isAscendancyClassVisible);
		}

		nodes.filter(n => n.IsSkill).forEach(nodeModel => {
			if (appState.treeStates.get(treeStateIndex).nodeStates.get(nodeModel.Id).activeState === NodeStateEnum.Active) {
				appState = appState.setIn(["treeStates", treeStateIndex, "nodeStates", nodeModel.Id, "activeState"], NodeStateEnum.Inactive);
				this.findOrphanedNodes(appState, treeStateIndex).forEach(n => { appState = appState = appState.setIn(["treeStates", treeStateIndex, "nodeStates", n.Id, "activeState"], NodeStateEnum.Inactive); return true; });
			}
			else {
				let nodesToActivate = Immutable.List(this.findShortestPathToInactiveNode(appState, treeStateIndex, nodeModel));
				nodesToActivate.forEach(n => { appState = appState.setIn(["treeStates", treeStateIndex, "nodeStates", n.Id, "activeState"], NodeStateEnum.Active); return true; });
			}
		});

		appState = this.calculatePointsSpent(appState, treeStateIndex);
		appState = this.calculateBuildHash(appState, treeStateIndex);
		return appState;
	}

	private static findOrphanedNodes(appState: AppStateRecord, treeStateIndex: number): Immutable.Iterable<number, Node> {
		let treeState = appState.treeStates.get(treeStateIndex);
		let classNode = appState.treeModel.Nodes.find(n => n.NodeType === NodeType.Class && treeState.nodeStates.get(n.Id).activeState === NodeStateEnum.Active);
		let checkedNodes = Immutable.Repeat(false, appState.treeModel.Nodes.max(n => n.Id).Id).toMap().set(classNode.Id, true);
		let nonOrphanedNodes = Immutable.List<Node>().push(classNode);
		let nodesToCheckQueue = <Immutable.Iterable<number, Node>>classNode.ConnectedNodes;

		while (!nodesToCheckQueue.isEmpty()) {
			let currentNode = nodesToCheckQueue.last();
			nodesToCheckQueue = nodesToCheckQueue.butLast();

			if (checkedNodes.get(currentNode.Id)) continue;
			checkedNodes = checkedNodes.set(currentNode.Id, true);
			if (treeState.nodeStates.get(currentNode.Id).activeState === NodeStateEnum.Inactive) continue;
			nonOrphanedNodes = nonOrphanedNodes.push(currentNode);
			nodesToCheckQueue = nodesToCheckQueue.concat(currentNode.ConnectedNodes);
		}

		return appState.treeModel.Nodes.filter(n => treeState.nodeStates.get(n.Id).activeState === NodeStateEnum.Active).filter(n => !nonOrphanedNodes.contains(n));
	}

	private static findShortestPathToInactiveNode(appState: AppStateRecord, treeStateIndex: number, targetNode: Node): Immutable.List<Node> {
		let treeState = appState.treeStates.get(treeStateIndex);
		let nodesAtCurrentDepth = appState.treeModel.Nodes.filter(n => treeState.nodeStates.get(n.Id).activeState === NodeStateEnum.Active)
			.flatMap(activeNode => activeNode.ConnectedNodes.filter(cn => treeState.nodeStates.get(cn.Id).activeState === NodeStateEnum.Inactive)
				.map(connectedNode => new Tuple(connectedNode, Immutable.List<Node>([connectedNode]))));

		let subclassName = appState.treeModel.SelectedSubClass(appState).Name;
		let nodesAtNextDepth = new Array<Tuple<Node, Immutable.List<Node>>>();
		let checkedNodes = Immutable.Map<number, boolean>();
		appState.treeModel.Nodes.forEach(n => checkedNodes = checkedNodes.set(n.Id, false));
		let result = Immutable.List<Node>();

		while (!nodesAtCurrentDepth.isEmpty() && result.isEmpty()) {
			nodesAtCurrentDepth.forEach(current => {
				let currentNode = current.Item1;
				let currentPath = current.Item2;
				checkedNodes = checkedNodes.set(currentNode.Id, true);
				if (currentNode.NodeType === NodeType.Class) return;
				if (currentNode.Id === targetNode.Id) result = currentPath;

				currentNode.ConnectedNodes
					.filter(cn => !checkedNodes.get(cn.Id))
					.filter(cn => cn.AscendancyName === currentNode.AscendancyName)
					.forEach(cn => nodesAtNextDepth.push(new Tuple(cn, currentPath.push(cn))));
			});

			nodesAtCurrentDepth = Immutable.List(nodesAtNextDepth);
			nodesAtNextDepth = [];
		}

		return Immutable.List(result);
	}

	public static highlightPathToNode(appState: AppStateRecord, treeStateIndex: number, nodes: Immutable.List<Node>): AppStateRecord {
		let validNodes = nodes.filter(n => n.IsSkill);
		if (validNodes.isEmpty()) return appState;

		let targetNode = validNodes.first();

		if (appState.treeStates.get(treeStateIndex).nodeStates.get(targetNode.Id).activeState === NodeStateEnum.Active) {
			appState = appState.setIn(["treeStates", treeStateIndex, "nodeStates", targetNode.Id, "activeState"], NodeStateEnum.Inactive);
			this.findOrphanedNodes(appState, treeStateIndex).forEach(highlightedNode => {
				appState = appState.setIn(["treeStates", treeStateIndex, "nodeStates", highlightedNode.Id, "isOrphanHighlighted"], true);
			});
			appState = appState.setIn(["treeStates", treeStateIndex, "nodeStates", targetNode.Id, "activeState"], NodeStateEnum.Active);
			appState = appState.setIn(["treeStates", treeStateIndex, "nodeStates", targetNode.Id, "isOrphanHighlighted"], true);
		}
		else {
			let highlightedPath = this.findShortestPathToInactiveNode(appState, treeStateIndex, targetNode);
			let nodeStates = appState.treeStates.get(treeStateIndex).nodeStates;
			highlightedPath.forEach(highlightedNode => nodeStates = nodeStates.set(highlightedNode.Id, nodeStates.get(highlightedNode.Id).set("isHighlighted", true)));
			appState = appState.setIn(["treeStates", treeStateIndex, "nodeStates"], nodeStates);
		}

		return appState;
	}

	public static activateClass(appState: AppStateRecord, treeStateIndex: number, classId: number): AppStateRecord {
		let classSpec = appState.treeModel.ClassSpecs.find(c => c.BaseClassId === classId);
		let subClassSpec = classSpec.SubClasses.first();
		appState = this.resetNodes(appState, treeStateIndex);
		appState = this.changeClass(appState, treeStateIndex, classId);
		appState = this.changeSubClass(appState, treeStateIndex, subClassSpec.Id);
		appState = this.calculatePointsSpent(appState, treeStateIndex);
		appState = this.calculateBuildHash(appState, treeStateIndex);
		return appState;
	}

	public static activateSubClass(appState: AppStateRecord, treeStateIndex: number, subClassId: number): AppStateRecord {
		let classSpec = appState.treeModel.ClassSpecs.find(c => c.BaseClassId === appState.treeStates.get(appState.uiState.listSelectionIndex).selectedClass);
		let subClassSpec = classSpec.SubClasses.find(c => c.Id === subClassId);
		appState = this.changeSubClass(appState, treeStateIndex, subClassSpec.Id);
		appState = this.calculatePointsSpent(appState, treeStateIndex);
		appState = this.calculateBuildHash(appState, treeStateIndex);
		return appState;
	}

	private static changeClass(appState: AppStateRecord, treeStateIndex: number, classId: number): AppStateRecord {
		let classInternalName = ParsingConstants.ClassIdentifierToName[classId];
		let classNodeId = ParsingConstants.ClassToNodeId[classInternalName];
		let classNode = appState.treeModel.Nodes.find(n => n.Id === classNodeId);

		appState = appState.setIn(["treeStates", treeStateIndex, "nodeStates", classNodeId, "activeState"], NodeStateEnum.Active);
		appState = appState.setIn(["treeStates", treeStateIndex, "selectedClass"], classId);
		return appState;
	}

	private static changeSubClass(appState: AppStateRecord, treeStateIndex: number, subClassId: number): AppStateRecord {
		let classSpec = appState.treeModel.ClassSpecs.find(c => c.BaseClassId === appState.treeStates.get(treeStateIndex).selectedClass);
		let subClassSpec = classSpec.SubClasses.find(c => c.Id === subClassId);
		let ascendancyNode = appState.treeModel.Nodes.find(n => n.IsAscendancyStart && n.AscendancyName === subClassSpec.Name);

		appState.treeModel.Nodes.filter(n => n.IsAscendancyStart).forEach(n => appState = appState.setIn(["treeStates", treeStateIndex, "nodeStates", n.Id, "activeState"], NodeStateEnum.Inactive));
		appState = appState.setIn(["treeStates", treeStateIndex, "selectedSubClass"], subClassId);
		appState = appState.setIn(["treeStates", treeStateIndex, "nodeStates", ascendancyNode.Id, "activeState"], NodeStateEnum.Active);
		return appState;
	}

	private static calculatePointsSpent(appState: AppStateRecord, treeStateIndex: number): AppStateRecord {
		let pointsSpent = appState.treeModel.Nodes.count(n => n.IsSkill && appState.treeStates.get(treeStateIndex).nodeStates.get(n.Id).activeState === NodeStateEnum.Active && n.AscendancyName === null);
		let ascendancyPointsSpent = appState.treeModel.Nodes.count(n => n.IsSkill && appState.treeStates.get(treeStateIndex).nodeStates.get(n.Id).activeState === NodeStateEnum.Active && n.AscendancyName !== null && !n.IsAscendancyStart);
		appState = appState.setIn(["treeStates", treeStateIndex, "pointsSpent"], pointsSpent);
		appState = appState.setIn(["treeStates", treeStateIndex, "ascendancyPointsSpent"], ascendancyPointsSpent);
		return appState;
	}

	public static resetNodes(appState: AppStateRecord, treeStateIndex: number): AppStateRecord {
		appState.treeModel.Nodes.forEach(n => { appState = appState.setIn(["treeStates", treeStateIndex, "nodeStates", n.Id, "activeState"], NodeStateEnum.Inactive); return true; });
		return appState;
	}

	private static getHash(urlOrHash: string): string {
		let hashIndex = urlOrHash.indexOf("#");
		if (hashIndex === -1) throw new Error("Invalid hash");
		return urlOrHash.substr(hashIndex + 1, urlOrHash.length - hashIndex);
	}

	public static importBuild(appState: AppStateRecord, treeStateIndex: number, hash: string): AppStateRecord {
		let initialAppState = appState;

		try {
			hash = this.getHash(hash);
			if (hash === appState.treeStates.get(treeStateIndex).hash) return appState;
			appState = this.resetNodes(appState, treeStateIndex);
			let nodeIds = Immutable.List<number>(this.decode(hash));
			let nodes = nodeIds.map(id => appState.treeModel.Nodes.find(n => n.Id === id));
			nodes.forEach(n => { appState = appState.setIn(["treeStates", treeStateIndex, "nodeStates", n.Id, "activeState"], NodeStateEnum.Active); return true; });

			for (let nodeId in ParsingConstants.NodeIdToClass) {
				let className = ParsingConstants.NodeIdToClass[nodeId];
				let classId = ParsingConstants.ClassNameToIdentifier[className];
				let node = appState.treeStates.get(appState.uiState.listSelectionIndex).nodeStates.get(parseInt(nodeId));

				if (node.activeState === NodeStateEnum.Active) {
					let classSpec = appState.treeModel.ClassSpecs.find(c => c.BaseClassId === classId);
					let ascendancyNode = nodes.find(n => n.IsAscendancyStart && appState.treeStates.get(appState.uiState.listSelectionIndex).nodeStates.get(n.Id).activeState === NodeStateEnum.Active);
					let subClassSpec = classSpec.SubClasses.find(c => c.Name === ascendancyNode.Name);
					appState = appState.setIn(["treeStates", treeStateIndex, "selectedClass"], classSpec.BaseClassId);
					appState = appState.setIn(["treeStates", treeStateIndex, "selectedSubClass"], subClassSpec.Id);
				}
			}

			appState = this.calculatePointsSpent(appState, treeStateIndex);
			appState = this.calculateBuildHash(appState, treeStateIndex);
			return appState;
		}
		catch (e) {
			return this.activateClass(initialAppState, appState.uiState.listSelectionIndex, 0);
		}
	}

	private static calculateBuildHash(appState: AppStateRecord, treeStateIndex: number): AppStateRecord {
		let nodeIdsInBuild = appState.treeModel.Nodes.filter(n => appState.treeStates.get(treeStateIndex).nodeStates.get(n.Id).activeState === NodeStateEnum.Active && n.NodeType !== NodeType.Class).map(n => n.Id);
		let encodedBuild = this.encode(appState.treeStates.get(treeStateIndex).selectedClass, nodeIdsInBuild.toArray());
		return appState.setIn(["treeStates", treeStateIndex, "hash"], encodedBuild);
	}

	private static decode(encodedBuild: string): Array<number> {
		let nodes = [];
		encodedBuild = encodedBuild.replace(/-/g, "+").replace(/_/g, "/");
		let decodedBuild = atob(encodedBuild);

		for (let i = 7; i < decodedBuild.length; i += 2) {
			nodes.push(decodedBuild.charCodeAt(i) * 256 + decodedBuild.charCodeAt(i + 1));
		}

		let classId = decodedBuild[4].charCodeAt(0);
		let className = ParsingConstants.ClassIdentifierToName[classId];
		let classNodeId = ParsingConstants.ClassToNodeId[className];
		nodes.push(classNodeId);
		return nodes;
	}

	private static encode(classId: number, nodeIds: Array<number>): string {
		let encodedBuild = "";
		let sortedNumbers = Immutable.List<number>(nodeIds).sortBy(v => v).toArray();
		let numbers = [0, 4, classId << 8]

		for (let i = 0; i < numbers.length; i++) {
			let char1 = (numbers[i] & 0xff00) >> 8;
			let char2 = numbers[i] & 0x00ff;
			encodedBuild += String.fromCharCode(char1) + String.fromCharCode(char2);
		}
		encodedBuild += "\x00"
		for (let i = 0; i < sortedNumbers.length; i++) {

			let char1 = (sortedNumbers[i] & 0xff00) >> 8;
			let char2 = sortedNumbers[i] & 0x00ff;
			encodedBuild += String.fromCharCode(char1) + String.fromCharCode(char2);
		}

		return btoa(encodedBuild.replace(/\+/g, "-").replace(/\//, "_"));
	}
}