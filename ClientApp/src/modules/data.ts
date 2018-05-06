import * as Immutable from 'immutable';
import { BaseItem, UniqueItem, StatDefinitionCollection } from "assets/items/item-data-types";

import "assets/skill-tree/data/ascendancy.json";
import "assets/skill-tree/data/skilltree.json";
import 'assets/items/bases.json';
import 'assets/items/gems.json';
import 'assets/items/uniques.json';
import 'assets/items/weaponTypes.json';

export var ascendancyData = require("assets/skill-tree/data/ascendancy.json");
export var skillTreeData = require("assets/skill-tree/data/skilltree.json");
export var bases = Immutable.List<BaseItem>(require("assets/items/bases"));
export var itemClasses = bases.groupBy(b => b.itemClass).keySeq().toArray();
export var rarity = ["Normal", "Magic", "Rare"];
export var uniques = Immutable.List<UniqueItem>(require("assets/items/uniques.json"));
export var gems = require("assets/items/gems.json");
export var stats: StatDefinitionCollection = new StatDefinitionCollection(require("assets/items/stats.json"));
export var weaponTypes: string[] = require("assets/items/weaponTypes.json");
