export interface AnimalDef {
  id: string;
  nameKey: string;
  meat: boolean;
}

export interface ProductDef {
  id: string;
  nameKey: string;
  meat: boolean;
}

export interface BuildingDef {
  id: string;
  nameKey: string;
  meat: boolean;
}

export interface RecipeDef {
  id: string;
  nameKey: string;
  buildingId: string;
  inputs: readonly string[];
  output: string;
  meat: boolean;
}

export interface LevelGoalDef {
  id: string;
  labelKey: string;
  meat: boolean;
}

export interface LevelDef {
  id: string;
  goals: readonly LevelGoalDef[];
}
