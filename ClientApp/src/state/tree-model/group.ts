import { GroupType } from "./enums";
import { SkillTreeImage } from "./skilltreeimage";
import * as Immutable from "immutable";
import { Point } from "shared/geometry";

export class Group {
	public Id: number;
	public Location: Point;
	public Images: Immutable.List<SkillTreeImage>;
	public GroupType: GroupType;

	public constructor() {
		this.Images = Immutable.List<SkillTreeImage>();
		this.GroupType = GroupType.Normal;
	}
}