import { SelectField } from "./widgets/select-field/select-field.component";
import { App } from './app/app.component';
import { ActionBar } from './pages/skill-tree/action-bar/action-bar.component';
import { StatePath } from './state-path/state-path.directive';
import { ComboField } from './widgets/combo-field/combo-field.component';
import { ListEditor } from "components/list-editor/list-editor.component";
import { TextField } from "components/widgets/text-field/text-field.component";
import { SkillTree } from "components/pages/skill-tree/skill-tree.component";
import { Stats } from "components/pages/stats/stats.component";
import { Gems } from "components/pages/gems/gems.component";
import { Loadouts } from "components/pages/loadouts/loadouts.component";
import { ItemBank } from "components/pages/item-bank/item-bank.component";
import { BuildSummary } from "components/pages/skill-tree/buildsummary/buildsummary.component";
import { NodeDetails } from "components/pages/skill-tree/nodedetails/nodedetails.component";
import { Button } from "components/widgets/button/button.component";
import { Field } from "components/widgets/field/field.component";
import { NumericField } from "components/widgets/numeric-field/numeric.component";

const COMPONENT_DIRECTIVES = [
	App,
	BuildSummary,
	NodeDetails,
	SkillTree,
	Stats,
	Gems,
	Loadouts,
	ItemBank,
	ListEditor,
	TextField,
	ComboField,
	Button,
	StatePath,
	Field,
	SelectField,
	ActionBar,
	NumericField
];

export { ItemBank, Loadouts, Gems, Stats, App, BuildSummary, NodeDetails, SkillTree, COMPONENT_DIRECTIVES };