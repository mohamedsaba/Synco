import { describe, expect, it, vi } from 'vitest';

import {
  executeFileSwitch,
  executeSubmitAssessment,
  formatSaveFailureBeforeSubmit,
  formatSaveFailureBeforeSwitch,
} from '../../apps/web/app/candidate/[token]/candidate-workspace-actions';

describe('Candidate Save Integrity — Client Workflow & Action Coordination', () => {
  describe('File Switching', () => {
    it('Requirement 1: successful save permits file switch', async () => {
      let saved = false;
      let switchedTo: string | null = null;
      let loadedContent: string | null = null;

      const success = await executeFileSwitch({
        currentFile: 'inventory/service.py',
        targetFile: 'inventory/models.py',
        content: 'candidate edit in service.py',
        isDirty: true,
        isBusy: false,
        saveCurrentFile: async () => {
          saved = true;
        },
        loadTargetFile: async (path) => ({
          path,
          content: 'models.py original content',
        }),
        onSaveFailure: vi.fn(),
        onSwitchSuccess: (loaded) => {
          switchedTo = loaded.path;
          loadedContent = loaded.content;
        },
        onLoadFailure: vi.fn(),
      });

      expect(success).toBe(true);
      expect(saved).toBe(true);
      expect(switchedTo).toBe('inventory/models.py');
      expect(loadedContent).toBe('models.py original content');
    });

    it('Requirement 2: failed save blocks file switch', async () => {
      const loadTargetSpy = vi.fn();
      const onSwitchSuccessSpy = vi.fn();
      let capturedError: Error | null = null;

      const success = await executeFileSwitch({
        currentFile: 'inventory/service.py',
        targetFile: 'inventory/models.py',
        content: 'candidate edit that cannot be persisted',
        isDirty: true,
        isBusy: false,
        saveCurrentFile: async () => {
          throw new Error('Sandbox write failed (container disk full)');
        },
        loadTargetFile: loadTargetSpy,
        onSaveFailure: (error) => {
          capturedError = error;
        },
        onSwitchSuccess: onSwitchSuccessSpy,
        onLoadFailure: vi.fn(),
      });

      expect(success).toBe(false);
      expect(loadTargetSpy).not.toHaveBeenCalled();
      expect(onSwitchSuccessSpy).not.toHaveBeenCalled();
      expect(capturedError).toBeDefined();
      expect(capturedError!.message).toContain(
        'Sandbox write failed (container disk full)',
      );
    });

    it('Requirement 3 & 4: failed save preserves current editor text, keeps current file selected, and formats factual message', async () => {
      const editorState = {
        selectedFile: 'inventory/service.py',
        content: 'critical bugfix in service.py that must not be lost',
        isDirty: true,
        notice: null as string | null,
      };

      const failureMessage = 'Network connection reset by peer';

      const success = await executeFileSwitch({
        currentFile: editorState.selectedFile,
        targetFile: 'inventory/models.py',
        content: editorState.content,
        isDirty: editorState.isDirty,
        isBusy: false,
        saveCurrentFile: async () => {
          throw new Error(failureMessage);
        },
        loadTargetFile: async (path) => ({
          path,
          content: 'models.py content that should never be loaded',
        }),
        onSaveFailure: (error) => {
          editorState.notice = formatSaveFailureBeforeSwitch(
            editorState.selectedFile,
            error,
          );
        },
        onSwitchSuccess: (loaded) => {
          editorState.selectedFile = loaded.path;
          editorState.content = loaded.content;
          editorState.isDirty = false;
        },
        onLoadFailure: vi.fn(),
      });

      expect(success).toBe(false);
      // Editor text remains completely preserved
      expect(editorState.content).toBe(
        'critical bugfix in service.py that must not be lost',
      );
      // Current file remains selected
      expect(editorState.selectedFile).toBe('inventory/service.py');
      // Buffer remains dirty
      expect(editorState.isDirty).toBe(true);
      // Factual notice displayed to candidate
      expect(editorState.notice).toBe(
        'Your changes to inventory/service.py could not be saved: Network connection reset by peer. Retry saving before switching files.',
      );
    });

    it('Requirement 5: retry after failed save can succeed and then switch', async () => {
      let saveAttempts = 0;
      let shouldSucceedOnRetry = false;

      const editorState = {
        selectedFile: 'inventory/service.py',
        content: 'def compute_inventory(): return 42',
        isDirty: true,
        notice: null as string | null,
      };

      const saveCurrentFile = async () => {
        saveAttempts++;
        if (!shouldSucceedOnRetry) {
          throw new Error('503 Service Unavailable');
        }
      };

      // 1. First switch attempt: save fails
      const firstResult = await executeFileSwitch({
        currentFile: editorState.selectedFile,
        targetFile: 'inventory/models.py',
        content: editorState.content,
        isDirty: editorState.isDirty,
        isBusy: false,
        saveCurrentFile,
        loadTargetFile: async (path) => ({
          path,
          content: 'models content',
        }),
        onSaveFailure: (error) => {
          editorState.notice = formatSaveFailureBeforeSwitch(
            editorState.selectedFile,
            error,
          );
        },
        onSwitchSuccess: (loaded) => {
          editorState.selectedFile = loaded.path;
          editorState.content = loaded.content;
          editorState.isDirty = false;
        },
        onLoadFailure: vi.fn(),
      });

      expect(firstResult).toBe(false);
      expect(saveAttempts).toBe(1);
      expect(editorState.selectedFile).toBe('inventory/service.py');
      expect(editorState.content).toBe('def compute_inventory(): return 42');
      expect(editorState.isDirty).toBe(true);
      expect(editorState.notice).toContain('503 Service Unavailable');

      // 2. Platform/sandbox recovers, candidate retries the switch
      shouldSucceedOnRetry = true;
      const retryResult = await executeFileSwitch({
        currentFile: editorState.selectedFile,
        targetFile: 'inventory/models.py',
        content: editorState.content,
        isDirty: editorState.isDirty,
        isBusy: false,
        saveCurrentFile,
        loadTargetFile: async (path) => ({
          path,
          content: 'models content',
        }),
        onSaveFailure: (error) => {
          editorState.notice = formatSaveFailureBeforeSwitch(
            editorState.selectedFile,
            error,
          );
        },
        onSwitchSuccess: (loaded) => {
          editorState.selectedFile = loaded.path;
          editorState.content = loaded.content;
          editorState.isDirty = false;
          editorState.notice = null;
        },
        onLoadFailure: vi.fn(),
      });

      expect(retryResult).toBe(true);
      expect(saveAttempts).toBe(2);
      expect(editorState.selectedFile).toBe('inventory/models.py');
      expect(editorState.content).toBe('models content');
      expect(editorState.isDirty).toBe(false);
      expect(editorState.notice).toBeNull();
    });

    it('Requirement 11a: ignores switch request if already on the selected file or busy', async () => {
      const saveSpy = vi.fn();
      const loadSpy = vi.fn();

      // Same file switch
      const sameFileResult = await executeFileSwitch({
        currentFile: 'inventory/service.py',
        targetFile: 'inventory/service.py',
        content: 'content',
        isDirty: true,
        isBusy: false,
        saveCurrentFile: saveSpy,
        loadTargetFile: loadSpy,
        onSaveFailure: vi.fn(),
        onSwitchSuccess: vi.fn(),
        onLoadFailure: vi.fn(),
      });
      expect(sameFileResult).toBe(false);
      expect(saveSpy).not.toHaveBeenCalled();
      expect(loadSpy).not.toHaveBeenCalled();

      // Busy action in flight
      const busyResult = await executeFileSwitch({
        currentFile: 'inventory/service.py',
        targetFile: 'inventory/models.py',
        content: 'content',
        isDirty: true,
        isBusy: true,
        saveCurrentFile: saveSpy,
        loadTargetFile: loadSpy,
        onSaveFailure: vi.fn(),
        onSwitchSuccess: vi.fn(),
        onLoadFailure: vi.fn(),
      });
      expect(busyResult).toBe(false);
      expect(saveSpy).not.toHaveBeenCalled();
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('switches cleanly without calling save if editor is not dirty', async () => {
      const saveSpy = vi.fn();
      let loadedPath = '';

      const success = await executeFileSwitch({
        currentFile: 'inventory/service.py',
        targetFile: 'inventory/models.py',
        content: 'unmodified content',
        isDirty: false,
        isBusy: false,
        saveCurrentFile: saveSpy,
        loadTargetFile: async (path) => ({ path, content: 'clean target' }),
        onSaveFailure: vi.fn(),
        onSwitchSuccess: (loaded) => {
          loadedPath = loaded.path;
        },
        onLoadFailure: vi.fn(),
      });

      expect(success).toBe(true);
      expect(saveSpy).not.toHaveBeenCalled();
      expect(loadedPath).toBe('inventory/models.py');
    });
  });

  describe('Submission Gating', () => {
    it('Requirement 6: successful save permits submission', async () => {
      let saveCalled = false;
      let submitCalled = false;
      let submitSuccessCalled = false;

      const success = await executeSubmitAssessment({
        isDirty: true,
        isBusy: false,
        saveCurrentFile: async () => {
          saveCalled = true;
        },
        submitAssessment: async () => {
          submitCalled = true;
        },
        onSaveFailure: vi.fn(),
        onSubmitSuccess: () => {
          submitSuccessCalled = true;
        },
        onSubmitFailure: vi.fn(),
      });

      expect(success).toBe(true);
      expect(saveCalled).toBe(true);
      expect(submitCalled).toBe(true);
      expect(submitSuccessCalled).toBe(true);
    });

    it('Requirement 7: failed save prevents submission request', async () => {
      const submitSpy = vi.fn();
      let capturedSaveError: Error | null = null;

      const success = await executeSubmitAssessment({
        isDirty: true,
        isBusy: false,
        saveCurrentFile: async () => {
          throw new Error('Save workspace file rejected with 500');
        },
        submitAssessment: submitSpy,
        onSaveFailure: (error) => {
          capturedSaveError = error;
        },
        onSubmitSuccess: vi.fn(),
        onSubmitFailure: vi.fn(),
      });

      expect(success).toBe(false);
      // Submission API was NEVER called
      expect(submitSpy).not.toHaveBeenCalled();
      expect(capturedSaveError).toBeDefined();
      expect(capturedSaveError!.message).toBe(
        'Save workspace file rejected with 500',
      );
    });

    it('Requirement 8: failed save preserves current editor text during failed submission attempt', async () => {
      const candidateState = {
        content: 'export const solveProblem = () => 100;',
        isDirty: true,
        status: 'ACTIVE' as 'ACTIVE' | 'SUBMITTED',
        notice: null as string | null,
      };

      let failureError: Error | null = null;

      const success = await executeSubmitAssessment({
        isDirty: candidateState.isDirty,
        isBusy: false,
        saveCurrentFile: async () => {
          throw new Error('I/O error during workspace diff capture');
        },
        submitAssessment: async () => {
          candidateState.status = 'SUBMITTED';
        },
        onSaveFailure: (error) => {
          failureError = error;
        },
        onSubmitSuccess: vi.fn(),
        onSubmitFailure: vi.fn(),
      });

      expect(success).toBe(false);
      // Content remains untouched in the editor
      expect(candidateState.content).toBe(
        'export const solveProblem = () => 100;',
      );
      // Buffer remains dirty
      expect(candidateState.isDirty).toBe(true);
      // Session status remains ACTIVE, not SUBMITTED
      expect(candidateState.status).toBe('ACTIVE');

      // Formats factual message
      const formattedNotice = formatSaveFailureBeforeSubmit(failureError!);
      expect(formattedNotice).toBe(
        'Your latest changes could not be saved: I/O error during workspace diff capture. The assessment was not submitted.',
      );
    });

    it('Requirement 11b: ignores submit clicks if already busy', async () => {
      const saveSpy = vi.fn();
      const submitSpy = vi.fn();

      const success = await executeSubmitAssessment({
        isDirty: true,
        isBusy: true, // Another operation currently running
        saveCurrentFile: saveSpy,
        submitAssessment: submitSpy,
        onSaveFailure: vi.fn(),
        onSubmitSuccess: vi.fn(),
        onSubmitFailure: vi.fn(),
      });

      expect(success).toBe(false);
      expect(saveSpy).not.toHaveBeenCalled();
      expect(submitSpy).not.toHaveBeenCalled();
    });

    it('submits directly without saving when editor is not dirty', async () => {
      const saveSpy = vi.fn();
      let submitCalled = false;

      const success = await executeSubmitAssessment({
        isDirty: false,
        isBusy: false,
        saveCurrentFile: saveSpy,
        submitAssessment: async () => {
          submitCalled = true;
        },
        onSaveFailure: vi.fn(),
        onSubmitSuccess: vi.fn(),
        onSubmitFailure: vi.fn(),
      });

      expect(success).toBe(true);
      expect(saveSpy).not.toHaveBeenCalled();
      expect(submitCalled).toBe(true);
    });
  });
});
