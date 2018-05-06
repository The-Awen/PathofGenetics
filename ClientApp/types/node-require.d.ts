interface NodeRequire
{
	keys();
	(fileName : string);
	context(directory : string, includeSubDirectories : boolean, fileRegex : RegExp) : NodeRequire;
}