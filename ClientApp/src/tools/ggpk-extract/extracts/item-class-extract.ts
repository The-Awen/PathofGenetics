import { Database, Table, Row } from "../database";

let interestedBaseTypes: Array<string> = ["weapon", "armor", "jewellery", "off-hand", "flasks", "fishing rod"];

export function extractItemClasses(database: Database): Array<string> {
	return ["Jewel"].concat(
		database
			.table("ItemClasses.dat")
			.rows()
			.filter(r => interestedBaseTypes.some(c => r.value("Category").toLowerCase().indexOf(c) !== -1))
			.map(r => r.value("Name")))
		.sort();
}