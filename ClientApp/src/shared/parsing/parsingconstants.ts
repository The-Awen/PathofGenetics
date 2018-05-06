import * as Immutable from "immutable";

export class ParsingConstants
{
	public static MaxNumSkillsInGroupForDistance: Array<number> = [1, 6, 12, 12, 40];
	public static SkillDistancesFromGroupCenter: Array<number> = [0, 81.5, 163, 326, 489];
	public static SpriteRootUrl: string = "http://www.pathofexile.com/image/build-gen/passive-skill-sprite/";
	public static highestZoomFactorIndex: number;
	public static highestResolutionZoomFactor: number;

	public static ClassIconAssetMap: Object =
	{
		"StrDexIntClass": "centerscion",
		"StrClass": "centermarauder",
		"DexIntClass": "centershadow",
		"StrIntClass": "centertemplar",
		"IntClass": "centerwitch",
		"DexClass": "centerranger",
		"StrDexClass": "centerduelist",
	};

	public static ClassToNodeId: Object =
	{
		"StrDexIntClass": 58833,
		"StrClass": 47175,
		"DexIntClass": 44683,
		"StrIntClass": 61525,
		"IntClass": 54447,
		"DexClass": 50459,
		"StrDexClass": 50986,
	};

	public static NodeIdToClass: Object =
	{
		58833: "StrDexIntClass",
		47175: "StrClass",
		44683: "DexIntClass",
		61525: "StrIntClass",
		54447: "IntClass",
		50459: "DexClass",
		50986: "StrDexClass"
	};

	public static ClassIdentifierToName: Object =
	{
		2: "DexClass",
		6: "DexIntClass",
		3: "IntClass",
		1: "StrClass",
		4: "StrDexClass",
		0: "StrDexIntClass",
		5: "StrIntClass"
	}

	public static ClassNameToIdentifier: Object =
	{
		"DexClass": 2,
		"DexIntClass": 6,
		"IntClass": 3,
		"StrClass": 1,
		"StrDexClass": 4,
		"StrDexIntClass": 0,
		"StrIntClass": 5
	}

	public static Configure(skillTreeData: any)
	{
		this.highestZoomFactorIndex = skillTreeData.imageZoomLevels.length - 1;
		this.highestResolutionZoomFactor = skillTreeData.imageZoomLevels[this.highestZoomFactorIndex];
	}

	public static KeywordToCategoryMapping = Immutable.OrderedMap<string, string>()
		.set("base strength", "class")
		.set("base dexterity", "class")
		.set("base intelligence", "class")
		.set("jewel", "keystonejewel")
		.set("flask", "flask")
		.set("light radius", "misc")
		.set("aura", "aura")
		.set("trap", "trapandmine")
		.set("mine", "trapandmine")
		.set("reduced extra damage", "defense")
		.set("crit", "crit")
		.set("curse", "curse")
		.set("totem", "totem")
		.set("minion", "minion")
		.set("zombies", "minion")
		.set("skeletons", "minion")
		.set("spectres", "minion")
		.set("dexterity", "stat")
		.set("strength", "stat")
		.set("intelligence", "stat")
		.set("increased damage", "damage")
		.set("leech", "leech")
		.set("mana gained", "leech")
		.set("life gained", "leech")
		.set("life", "lifemanaes")
		.set("mana", "lifemanaes")
		.set("energy shield", "lifemanaes")
		.set("cast speed", "spell")
		.set("spell damage", "spell")
		.set("penetrates", "elemental")
		.set("resistance", "defense")
		.set("avoid", "defense")
		.set("shock", "elemental")
		.set("ignite", "elemental")
		.set("freeze", "elemental")
		.set("chill", "elemental")
		.set("burn", "elemental")
		.set("elemental", "elemental")
		.set("lightning", "elemental")
		.set("fire", "elemental")
		.set("cold", "elemental")
		.set("chaos", "chaos")
		.set("physical damage reduction", "defense")
		.set("physical", "physical")
		.set("projectile", "proj")
		.set("arrow speed", "proj")
		.set("pierce", "proj")
		.set("melee", "melee")
		.set("attack damage", "attack")
		.set("attack", "attack")
		.set("accuracy", "attack")
		.set("block", "defense")
		.set("shield", "defense")
		.set("evasion", "defense")
		.set("armour", "defense");
}
