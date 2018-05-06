import { NodeStateEnum, NodeType } from "./enums";
import { Group } from "./group";
import { NodeDetail } from "./nodedetail";
import { SkillTreeImage } from "./skilltreeimage";
import * as Immutable from "immutable";
import { Point } from "shared/geometry";
import { AppStateRecord, NodeStateRecord } from "state";

export class Node {
	public Id: number;
	public CenterPoint: Point;
	public Group: Group;
	public Radian: number;
	public Radius: number;
	public ImagesForState: Immutable.Map<NodeStateEnum, Immutable.List<SkillTreeImage>>;
	public NodeType: NodeType;
	public Name: string;
	public ConnectedNodes: Immutable.List<Node>;
	public Details: Array<NodeDetail>;
	public IsAscendancyStart: boolean;
	public AscendancyName: string;

	public constructor() {
		this.ConnectedNodes = Immutable.List<Node>();
		this.ImagesForState = Immutable.Map<NodeStateEnum, Immutable.List<SkillTreeImage>>();
		this.Details = new Array<NodeDetail>();
	}

	public get IsSkill() {
		return this.NodeType !== NodeType.Class && this.NodeType !== NodeType.Mastery;
	}
}