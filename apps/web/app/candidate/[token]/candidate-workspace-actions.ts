export interface FileSwitchParams {
  currentFile: string;
  targetFile: string;
  content: string;
  isDirty: boolean;
  isBusy: boolean;
  saveCurrentFile: () => Promise<boolean | void>;
  loadTargetFile: (path: string) => Promise<{ path: string; content: string }>;
  onSaveFailure: (error: Error) => void;
  onSwitchSuccess: (loaded: { path: string; content: string }) => void;
  onLoadFailure: (error: Error) => void;
  onSaveIncomplete?: () => void;
}

export const executeFileSwitch = async ({
  currentFile,
  targetFile,
  isDirty,
  isBusy,
  saveCurrentFile,
  loadTargetFile,
  onSaveFailure,
  onSwitchSuccess,
  onLoadFailure,
  onSaveIncomplete,
}: FileSwitchParams): Promise<boolean> => {
  if (targetFile === currentFile || isBusy) {
    return false;
  }

  if (isDirty) {
    try {
      if ((await saveCurrentFile()) === false) {
        onSaveIncomplete?.();
        return false;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onSaveFailure(err);
      return false;
    }
  }

  try {
    const loaded = await loadTargetFile(targetFile);
    onSwitchSuccess(loaded);
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onLoadFailure(err);
    return false;
  }
};

export interface SubmitAssessmentParams {
  isDirty: boolean;
  isBusy: boolean;
  saveCurrentFile: () => Promise<boolean | void>;
  submitAssessment: () => Promise<void>;
  onSaveFailure: (error: Error) => void;
  onSubmitSuccess: () => void;
  onSubmitFailure: (error: Error) => void;
  onSaveIncomplete?: () => void;
}

export const executeSubmitAssessment = async ({
  isDirty,
  isBusy,
  saveCurrentFile,
  submitAssessment,
  onSaveFailure,
  onSubmitSuccess,
  onSubmitFailure,
  onSaveIncomplete,
}: SubmitAssessmentParams): Promise<boolean> => {
  if (isBusy) {
    return false;
  }

  if (isDirty) {
    try {
      if ((await saveCurrentFile()) === false) {
        onSaveIncomplete?.();
        return false;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onSaveFailure(err);
      return false;
    }
  }

  try {
    await submitAssessment();
    onSubmitSuccess();
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onSubmitFailure(err);
    return false;
  }
};

export const formatSaveFailureBeforeSwitch = (fileName: string): string =>
  `We could not save your changes to ${fileName}. Your edits are still here. Retry saving before switching files.`;

export const formatSaveFailureBeforeSubmit = (): string =>
  'We could not save your changes. Your edits are still here. The assessment was not submitted.';

export const reconcileSubmissionResponse = (
  session: Readonly<{ status: string; closureReason: string | null }>,
): 'resume' | 'finalizing' | 'completed' | 'unknown' => {
  if (session.status === 'SUBMITTED') return 'completed';
  if (session.status !== 'ACTIVE') return 'unknown';
  return session.closureReason === null ? 'resume' : 'finalizing';
};
