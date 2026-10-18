// Type surface of taskrules.js. OWNER: Krishna.
export type TaskLabel = 'included' | 'excluded' | 'new' | 'defect' | 'unclear';
export interface TaskSuggestion {
  label: TaskLabel;
  matched: string | null; // the scope item it matched, if any
  reason: string;
  source: 'rules';
}
export function suggestTask(text: string, scope?: { included: string[]; excluded: string[] }): TaskSuggestion;
export function mentions(text: string, item: string): boolean;
