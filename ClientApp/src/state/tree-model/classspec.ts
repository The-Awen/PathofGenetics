import { AscendancyClassSpec } from "./ascendancyclassspec";
import * as Immutable from "immutable";

export class ClassSpec {
	public BaseClassId: number;
	public BaseClassName: string;
	public SubClasses: Immutable.List<AscendancyClassSpec>;

	public constructor() {
		this.SubClasses = Immutable.List<AscendancyClassSpec>();
	}
}