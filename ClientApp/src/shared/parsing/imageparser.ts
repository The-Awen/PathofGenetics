import { ParsingConstants } from "./parsingconstants";
import * as Immutable from "immutable";
import { Point, Size } from "shared/geometry";
import { NodeStateEnum, ImageLayer, SkillTreeImage, ImageType, Node } from "state/tree-model";

export class ImageParser {
	public constructor(private _skillTreeData: any) {

	}

	public ParseJewelAssets(nodeData: any, node: Node): void {
		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Active, Immutable.List(
			[
				this.GetAsset("JewelFrameAllocated").ChangeLayer(ImageLayer.Frame)
			]));

		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Inactive, Immutable.List(
			[
				this.GetAsset("JewelFrameUnallocated").ChangeLayer(ImageLayer.Frame)
			]));
	}

	public ParseMasteryNodeAssets(nodeData: any, node: Node): void {
		var inactiveIcon = this.ParseSprite(this._skillTreeData.skillSprites.mastery[ParsingConstants.highestZoomFactorIndex], nodeData.icon);
		inactiveIcon.Layer = ImageLayer.Icon;

		var images = [inactiveIcon];

		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Active, Immutable.List(images));
		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Inactive, Immutable.List(images));
	}

	public ParseKeystoneNodeAssets(nodeData: any, node: Node): void {
		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Active, Immutable.List(
			[
				this.GetAsset("KeystoneFrameAllocated").ChangeLayer(ImageLayer.Frame),
				this.GetSkillSprite("keystoneActive", nodeData.icon).ChangeLayer(ImageLayer.Icon)
			]));

		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Inactive, Immutable.List(
			[
				this.GetAsset("KeystoneFrameUnallocated").ChangeLayer(ImageLayer.Frame),
				this.GetSkillSprite("keystoneInactive", nodeData.icon).ChangeLayer(ImageLayer.Icon)
			]));
	}

	public ParseNotableNodeAssets(nodeData: any, node: Node): void {
		if (node.AscendancyName != null) {
			node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Active, Immutable.List(
				[
					this.GetAsset("PassiveSkillScreenAscendancyFrameLargeAllocated").ChangeLayer(ImageLayer.Frame),
					this.GetSkillSprite("notableActive", nodeData.icon).ChangeLayer(ImageLayer.Icon)
				]));

			node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Inactive, Immutable.List(
				[
					this.GetAsset("PassiveSkillScreenAscendancyFrameLargeNormal").ChangeLayer(ImageLayer.Frame),
					this.GetSkillSprite("notableInactive", nodeData.icon).ChangeLayer(ImageLayer.Icon)
				]));

			return;
		}

		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Active, Immutable.List(
			[
				this.GetAsset("NotableFrameAllocated").ChangeLayer(ImageLayer.Frame),
				this.GetSkillSprite("notableActive", nodeData.icon).ChangeLayer(ImageLayer.Icon)
			]));

		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Inactive, Immutable.List(
			[
				this.GetAsset("NotableFrameUnallocated").ChangeLayer(ImageLayer.Frame),
				this.GetSkillSprite("notableInactive", nodeData.icon).ChangeLayer(ImageLayer.Icon)
			]));
	}

	public ParseSimpleNodeAssets(nodeData: any, node: Node): void {
		if (node.IsAscendancyStart) {
			this.ParseAscendancyStartAssets(nodeData, node);
			return;
		}

		if (node.AscendancyName != null) {
			node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Active, Immutable.List(
				[
					this.GetAsset("PassiveSkillScreenAscendancyFrameSmallAllocated").ChangeLayer(ImageLayer.Frame),
					this.GetSkillSprite("normalActive", nodeData.icon).ChangeLayer(ImageLayer.Icon)
				]));

			node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Inactive, Immutable.List(
				[
					this.GetAsset("PassiveSkillScreenAscendancyFrameSmallNormal").ChangeLayer(ImageLayer.Frame),
					this.GetSkillSprite("normalInactive", nodeData.icon).ChangeLayer(ImageLayer.Icon)
				]));

			return;
		}

		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Active, Immutable.List(
			[
				this.GetAsset("PSSkillFrameActive").ChangeLayer(ImageLayer.Frame),
				this.GetSkillSprite("normalActive", nodeData.icon).ChangeLayer(ImageLayer.Icon)
			]));

		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Inactive, Immutable.List(
			[
				this.GetAsset("PSSkillFrame").ChangeLayer(ImageLayer.Frame),
				this.GetSkillSprite("normalInactive", nodeData.icon).ChangeLayer(ImageLayer.Icon)
			]));
	}

	public ParseClassNodeAssets(classNodeData: any, node: Node): void {
		var className = Immutable.Map<string, number>(this._skillTreeData.constants.classes).findKey(v => v == classNodeData.spc[0]);
		var assetName = ParsingConstants.ClassIconAssetMap[className];

		var inactiveIcon = this.GetAsset("PSStartNodeBackgroundInactive").ChangeLayer(ImageLayer.Icon);
		var activeIcon = this.GetAsset(assetName).ChangeLayer(ImageLayer.Icon);
		var backgroundImages = this.CreateBackgroundThree();

		var isCenterClass = Math.abs(node.CenterPoint.X) < 10.0 && Math.abs(node.CenterPoint.Y) < 10.0;
		var rotationAmount = 0;

		if (!isCenterClass) {
			var distToCenter = Math.sqrt(node.CenterPoint.X * node.CenterPoint.X + node.CenterPoint.Y * node.CenterPoint.Y);
			rotationAmount = Math.atan2(node.CenterPoint.X / distToCenter, -node.CenterPoint.Y / distToCenter);
		}

		var ascendancyButton = this.GetAsset("PassiveSkillScreenAscendancyButton").ChangeLayer(ImageLayer.Frame);
		ascendancyButton.RotationInRadians = rotationAmount;
		ascendancyButton.Offset.X = 270 * Math.cos(rotationAmount + Math.PI / 2);
		ascendancyButton.Offset.Y = 270 * Math.sin(rotationAmount + Math.PI / 2);

		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Active, Immutable.List(backgroundImages.concat(activeIcon).concat(ascendancyButton)));
		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Inactive, Immutable.List(backgroundImages.concat(inactiveIcon)));
	}

	public ParseAscendancyStartAssets(nodeData: any, node: Node): void {
		var images = [this.GetAsset("PassiveSkillScreenAscendancyMiddle").ChangeLayer(ImageLayer.Icon)];

		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Active, Immutable.List(images));
		node.ImagesForState = node.ImagesForState.set(NodeStateEnum.Inactive, Immutable.List(images));
	}

	public ParseGroupBackground(groupData: any): Immutable.List<SkillTreeImage> {
		if (Array.isArray(groupData.oo)) return Immutable.List(new Array<SkillTreeImage>());
		let keys: Immutable.Iterable<number, number> = Immutable.Map<string, string>(groupData.oo).keySeq().map(k => parseInt(k)).filter(key => key <= 3);
		if (keys.isEmpty()) return Immutable.List(new Array<SkillTreeImage>());
		var backgroundIndex = keys.max(k => k);
		if (backgroundIndex == 0) return Immutable.List(new Array<SkillTreeImage>());
		backgroundIndex = backgroundIndex > 3 ? 2 : backgroundIndex - 1;

		var images = new Array<SkillTreeImage>();

		if (backgroundIndex == 0) {
			var background = this.ParseImage(this._skillTreeData.assets.PSGroupBackground1[ParsingConstants.highestResolutionZoomFactor]);
			background.Layer = ImageLayer.Background;
			images.push(background);
		}

		if (backgroundIndex == 1 || backgroundIndex == 2) {
			var background = this.ParseImage(this._skillTreeData.assets.PSGroupBackground2[ParsingConstants.highestResolutionZoomFactor]);
			background.Layer = ImageLayer.Background;
			images.push(background);
		}

		if (backgroundIndex == 2) {
			images = images.concat(this.CreateBackgroundThree());
		}

		return Immutable.List(images);
	}

	private ParseSprite(spriteData: any, name: string): SkillTreeImage {
		var spriteDimensions = spriteData.coords[name];

		var image = new SkillTreeImage();
		image.Offset = new Point(0, 0);
		image.Size = new Size(spriteDimensions.w / ParsingConstants.highestResolutionZoomFactor, spriteDimensions.h / ParsingConstants.highestResolutionZoomFactor);
		image.SpriteLocation = new Point(spriteDimensions.x, spriteDimensions.y);
		image.SpriteSize = new Size(spriteDimensions.w, spriteDimensions.h);
		image.Url = ParsingConstants.SpriteRootUrl + spriteData.filename;
		image.Type = ImageType.Sprite;
		return image;
	}

	private ParseImage(imageUrl: any): SkillTreeImage {
		var image = new SkillTreeImage();
		image.Url = imageUrl;
		image.Offset = new Point(0, 0);
		image.Size = new Size(58 / ParsingConstants.highestResolutionZoomFactor, 58 / ParsingConstants.highestResolutionZoomFactor);
		image.SpriteLocation = new Point(0, 0);
		image.SpriteSize = new Size(58, 58);
		image.Type = ImageType.File;
		return image;
	}

	private GetSkillSprite(imageName: string, spriteName: string): SkillTreeImage {
		return this.ParseSprite(this._skillTreeData.skillSprites[imageName][ParsingConstants.highestZoomFactorIndex], spriteName);
	}

	private GetAsset(name: string): SkillTreeImage {
		return this.ParseImage(this._skillTreeData.assets[name][ParsingConstants.highestResolutionZoomFactor]);
	}

	private CreateBackgroundThree(): Array<SkillTreeImage> {
		var images = [];

		var backgroundTop = this.ParseImage(this._skillTreeData.assets.PSGroupBackground3[ParsingConstants.highestResolutionZoomFactor]);
		backgroundTop.Layer = ImageLayer.Background;
		backgroundTop.Offset = new Point(0, -72 / ParsingConstants.highestResolutionZoomFactor);
		images.push(backgroundTop);

		var backgroundBottom = this.ParseImage(this._skillTreeData.assets.PSGroupBackground3[ParsingConstants.highestResolutionZoomFactor]);
		backgroundBottom.Layer = ImageLayer.Background;
		backgroundBottom.RotationInRadians = Math.PI;
		backgroundBottom.Offset = new Point(0, 72 / ParsingConstants.highestResolutionZoomFactor);

		images.push(backgroundTop);
		images.push(backgroundBottom);
		return images;
	}
}