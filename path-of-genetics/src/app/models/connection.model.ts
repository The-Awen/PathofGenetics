import { Node } from "./node.model";
import { AppState } from "../states/app.state";
import { NodeState, NodeStateEnum } from "../states/node.state";


export class Connection {
	public constructor(public A: Node, public B: Node) {

	}

	public AreSame(other: Connection): boolean {
		return this.A == other.A && this.B == other.B
			|| this.A == other.B && this.B == other.A;
	}

	public IsHighlightedAsOrphan(nodeStates: { [key: string]: NodeState }): boolean {
		let a = nodeStates[this.A.Id];
		let b = nodeStates[this.B.Id];

		return a.isOrphanHighlighted && b.isOrphanHighlighted
			|| a.isOrphanHighlighted && b.activeState == NodeStateEnum.Active
			|| b.isOrphanHighlighted && a.activeState == NodeStateEnum.Active;
	}

	public IsHighlightedForActivation(nodeStates: { [key: string]: NodeState }): boolean {
		let a = nodeStates[this.A.Id];
		let b = nodeStates[this.B.Id];

		return a.isHighlighted && b.isHighlighted
			|| a.isHighlighted && b.activeState == NodeStateEnum.Active
			|| b.isHighlighted && a.activeState == NodeStateEnum.Active;
	}

	public IsActive(nodeStates: { [key: string]: NodeState }): boolean {
		let a = nodeStates[this.A.Id];
		let b = nodeStates[this.B.Id];
		return a.activeState == NodeStateEnum.Active && b.activeState == NodeStateEnum.Active;
	}
}