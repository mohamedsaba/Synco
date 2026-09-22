export type EditorPersistenceState =
  'SAVED' | 'DIRTY' | 'SAVING' | 'SAVE_FAILED';

export const deriveEditorPersistenceState = ({
  content,
  persistedContent,
  isSaving,
  saveFailed,
}: Readonly<{
  content: string;
  persistedContent: string;
  isSaving: boolean;
  saveFailed: boolean;
}>): EditorPersistenceState => {
  if (isSaving) return 'SAVING';
  if (saveFailed) return 'SAVE_FAILED';
  return content === persistedContent ? 'SAVED' : 'DIRTY';
};

export const editorPersistenceMessage = (
  state: EditorPersistenceState,
  hasNewerUnsavedChanges: boolean,
): string => {
  if (state === 'SAVING') {
    return hasNewerUnsavedChanges
      ? 'Saving… Newer changes are unsaved.'
      : 'Saving…';
  }
  if (state === 'SAVE_FAILED') return 'Save failed. Your edits are still here.';
  return state === 'SAVED' ? 'Saved' : 'Unsaved changes';
};
