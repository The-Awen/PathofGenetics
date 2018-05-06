import { Group } from "./group";
import { NodeDetail } from "./nodedetail";
import { SkillTreeImage } from "./skilltreeimage";
import { Point } from "shared/geometry";
import { AppState } from "../states/app.state";
import { NodeState, NodeStateEnum, NodeType } from "../states/node.state";


export class Node {
	public Id: number;
	public CenterPoint: Point;
	public Group: Group;
	public Radian: number;
	public Radius: number;
	public ImagesForState: Map<NodeStateEnum, Array<SkillTreeImage>>;
	public NodeType: NodeType;
	public Name: string;
	public ConnectedNodes: Array<Node>;
	public Details: Array<NodeDetail>;
	public IsAscendancyStart: boolean;
	public AscendancyName: string;

	public constructor() {
		this.ConnectedNodes = Array<Node>();
		this.ImagesForState = Map<NodeStateEnum, Array<SkillTreeImage>>();
		this.Details = new Array<NodeDetail>();
	}

	public get IsSkill() {
		return this.NodeType !== NodeType.Class && this.NodeType !== NodeType.Mastery;
	}
}