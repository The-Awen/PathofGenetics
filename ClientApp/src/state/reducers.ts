import { AppStateRecord } from "./";
import { Action, ActionReducer } from "@ngrx/store";
import * as Immutable from "immutable";
import { AppState, AppStateFactory } from "state";

export const initialState = AppStateFactory();

export const appStateReducer: ActionReducer<AppState> = (state: AppStateRecord = initialState, action: Action): AppStateRecord => {
	if (!action.payload) return state;
	return action.payload(state);
}
