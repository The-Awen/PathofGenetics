import { NodeState } from "./node-state";

export class TreeState {
	public name: string;
	public selectedClass: number;
	public selectedSubClass: number;
	public pointsSpent: number;
	public ascendancyPointsSpent: number;
	public nodeStates: Map<number, NodeState>;
	public searchResultNodeIds: Array<number>;
	public hash: string;
    public isAscendancyClassVisible: boolean;
    
    constructor() {
        
            this.name =  "Placeholder Tree Name",
            this.hash =  "",
            this.pointsSpent =  0,
            this.ascendancyPointsSpent =  0,
            this.selectedClass =  0,
            this.selectedSubClass =  0,
            this.searchResultNodeIds =  Array<number>(),
            this.nodeStates =  new Map<number, NodeState>(),
            this.isAscendancyClassVisible =  false
    }
}