import * as fs from "fs";
import * as process from "child_process";
import * as Immutable from "immutable";
import { Database, Table, Row } from "./database";
import { processStatsFile, extractGems, extractItemClasses, extractBaseItems, extractUniques } from "./extracts"

let outputDirectory = "./src/assets/items/"

let descriptionFiles = Immutable.List<string>([
	"src/tools/ggpk-extract/data/stat_descriptions.txt",
	"src/tools/ggpk-extract/data/skill_stat_descriptions.txt",
	"src/tools/ggpk-extract/data/active_skill_gem_stat_descriptions.txt"]);

let allJsonFile = "src/tools/ggpk-extract/data/all.json";

let uniqueItemUrls = [
	"http://pathofexile.gamepedia.com/List_of_unique_armour",
	"http://pathofexile.gamepedia.com/List_of_unique_weapons",
	"http://pathofexile.gamepedia.com/List_of_unique_accessories",
	"http://pathofexile.gamepedia.com/List_of_unique_flasks",
	"http://pathofexile.gamepedia.com/List_of_unique_jewels"
];

//process.execFileSync("pypoe_exporter", ["dat", "json", "src/tools/ggpk-extract/data/all.json"]);

let database = new Database(JSON.parse(fs.readFileSync(allJsonFile, "ascii")));
let allDescriptions = processStatsFile(descriptionFiles);
let itemClasses = extractItemClasses(database);
let baseTypes = extractBaseItems(database, itemClasses);

fs.writeFileSync(outputDirectory + "itemClasses.json", JSON.stringify(itemClasses, null, '\t'));
fs.writeFileSync(outputDirectory + "bases.json", JSON.stringify(baseTypes, null, '\t'));
fs.writeFileSync(outputDirectory + "gems.json", JSON.stringify(extractGems(database), null, '\t'));
fs.writeFileSync(outputDirectory + "stats.json", JSON.stringify(allDescriptions, null, '\t'));
extractUniques(baseTypes, uniqueItemUrls, allDescriptions).then(uniques => fs.writeFileSync(outputDirectory + "uniques.json", JSON.stringify(uniques, null, '\t')));
