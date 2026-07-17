export interface PersonaFormValues {
  productDescription: string;
  targetContext: string;
  knownUserData: string;
  personaCount: number;
}

export const DEFAULT_PERSONA_FORM_VALUES: PersonaFormValues = {
  productDescription: "",
  targetContext: "",
  knownUserData: "",
  personaCount: 3,
};
