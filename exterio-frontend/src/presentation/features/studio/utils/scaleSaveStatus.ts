export type ScaleSaveTone = 'problem' | 'saving' | 'saved' | 'unset';

export interface ScaleSaveStatus {
  tone: ScaleSaveTone;
  text: string;
}

export interface ScaleSaveState {
  /** Why the current values cannot be used, e.g. "Enter the wall width.", or null. */
  problem: string | null;
  /** A save is running or about to run. */
  isSaving: boolean;
  /** The project has a saved scale. */
  isSaved: boolean;
}

/** The one line under the scale inputs that says whether estimates are using them. */
export function scaleSaveStatus({ problem, isSaving, isSaved }: ScaleSaveState): ScaleSaveStatus {
  if (problem) {
    return { tone: 'problem', text: problem };
  }
  if (isSaving) {
    return { tone: 'saving', text: 'Saving…' };
  }
  if (isSaved) {
    return { tone: 'saved', text: 'Scale saves automatically. Estimates use it.' };
  }
  return {
    tone: 'unset',
    text: 'Estimates use a rough guess from a standard door or storey height until a size is set.',
  };
}
