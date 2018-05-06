export class Database {
	constructor(private rawTables) { }

	table(tableName: string): Table {
		return new Table(this, this.rawTables.find(t => t.filename === tableName));
	}
}

export class Table {
	constructor(private database: Database, private rawTable) { }

	row(index): Row {
		return new Row(this.database, this, this.rawTable.data[index]);
	}

	columnIndex(columnName): number {
		return this.rawTable.header.findIndex(h => h.name === columnName);
	}

	foreignTableName(columnName): string {
		return this.rawTable.header.find(h => h.name === columnName).key;
	}

	rows(): Row[] {
		let result = [];
		for (let i = 0; i < this.rawTable.data.length; i++) result.push(new Row(this.database, this, this.rawTable.data[i]));
		return result;
	}
}

export class Row {
	constructor(private database: Database, private table: Table, private rawRow) { }

	value(columnName): any {
		return this.rawRow[this.table.columnIndex(columnName)];
	}

	join(columnName): Row {
		let foreignTable = this.table.foreignTableName(columnName);
		let otherTable = this.database.table(foreignTable);
		return otherTable.row(this.value(columnName));
	}

	joinOn(columnName, foreignColumnName): Row {
		let foreignTable = this.table.foreignTableName(columnName);
		let otherTable = this.database.table(foreignTable);
		return otherTable.rows().find(r => r.value(foreignColumnName) === this.value(columnName))
	}

	joinMany(columnName): Row[] {
		let foreignTable = this.table.foreignTableName(columnName);
		let otherTable = this.database.table(foreignTable);
		return this.value(columnName).map(i => otherTable.row(i));
	}
}
