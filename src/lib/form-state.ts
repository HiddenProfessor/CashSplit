export type FormState = {
  message?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

export const EMPTY_FORM_STATE: FormState = {};