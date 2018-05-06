import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatGridListModule, MatToolbarModule } from '@angular/material';


import { AppComponent } from './app.component';
import { SkillTreeComponent } from './skill-tree/skill-tree.component';

@NgModule({
  declarations: [
    AppComponent,
    SkillTreeComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatGridListModule, 
    MatToolbarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
