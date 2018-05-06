export enum NodeStateEnum {Active, Inactive};
export enum NodeType {Keystone = 0, Notable = 1, Mastery = 2, Class = 3, Simple = 4, Jewel = 5};


export class NodeState {
	public id: number;
	public activeState: NodeStateEnum;
	public isHighlighted: boolean;
	public isOrphanHighlighted: boolean;
    public hovered: boolean;
    
    public constructor() {
        this.id = 0;
        this.activeState = NodeStateEnum.Inactive;
        this.isHighlighted = false;
        this.isOrphanHighlighted = false;
        this.hovered = false;
    }
}

