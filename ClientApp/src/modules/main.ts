import "components/styles/reset.scss";
import "components/styles/base.scss";
import "components/styles/page.scss";

import { AppModule } from "app.module";
import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

enableProdMode();
platformBrowserDynamic().bootstrapModule(AppModule);
