import { describe, expect, it } from 'vitest';

import {
  deriveEditorPersistenceState,
  editorPersistenceMessage,
} from '../../apps/web/app/candidate/[token]/editor-persistence';

describe('editor persistence state', () => {
  it('reports SAVED for freshly loaded matching content', () => {
    expect(
      deriveEditorPersistenceState({
        content: 'persisted',
        persistedContent: 'persisted',
        isSaving: false,
        saveFailed: false,
      }),
    ).toBe('SAVED');
  });

  it('reports DIRTY when editor content differs from persisted content', () => {
    expect(
      deriveEditorPersistenceState({
        content: 'new edit',
        persistedContent: 'persisted',
        isSaving: false,
        saveFailed: false,
      }),
    ).toBe('DIRTY');
  });

  it('reports SAVING while a request is in flight', () => {
    expect(
      deriveEditorPersistenceState({
        content: 'edit',
        persistedContent: 'persisted',
        isSaving: true,
        saveFailed: false,
      }),
    ).toBe('SAVING');
  });

  it('reports SAVE_FAILED until a retry starts', () => {
    expect(
      deriveEditorPersistenceState({
        content: 'edit',
        persistedContent: 'persisted',
        isSaving: false,
        saveFailed: true,
      }),
    ).toBe('SAVE_FAILED');
  });

  it('does not let an older save make newer content SAVED', () => {
    expect(
      deriveEditorPersistenceState({
        content: 'B',
        persistedContent: 'A',
        isSaving: false,
        saveFailed: false,
      }),
    ).toBe('DIRTY');
  });

  it('returns to SAVED after an exact retry succeeds', () => {
    expect(
      deriveEditorPersistenceState({
        content: 'B',
        persistedContent: 'B',
        isSaving: false,
        saveFailed: false,
      }),
    ).toBe('SAVED');
  });

  it('states that newer edits remain unsaved during saving', () => {
    expect(editorPersistenceMessage('SAVING', true)).toBe(
      'Saving… Newer changes are unsaved.',
    );
  });

  it('states that failed-save edits remain available', () => {
    expect(editorPersistenceMessage('SAVE_FAILED', false)).toBe(
      'Save failed. Your edits are still here.',
    );
  });
});
