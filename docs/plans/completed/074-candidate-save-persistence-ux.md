# C4 Candidate Save / Editor Persistence UX

## Delivered behavior

- The editor keeps local text separate from a server-confirmed persisted
  baseline. `SAVED`, `DIRTY`, `SAVING`, and `SAVE_FAILED` are derived from this
  local presentation state, never from a second session lifecycle.
- A save captures one file/content snapshot and serializes duplicate requests.
  Only its successful response advances the baseline. Edits made during that
  request remain dirty after an older response succeeds.
- Save failure keeps the local text and offers an accessible retry message. No
  server content replaces local edits after a failed request.
- Dirty switches save first. A failed save, or newer edits made during the
  save, keeps the original file selected. Failed file loads preserve it too.
- Manual submission retains existing save-before-submit behavior. It does not
  submit if the required save fails or newer local edits remain unsaved.
- Multi-file save responses now include normalized persisted content so the
  client baseline reflects exact server content. Existing authorization,
  ACTIVE-only checks, deadline admission, and finality are unchanged.

## Boundaries

- Browser refresh reconstructs server-persisted content only. Unsaved text is
  not retained locally.
- C5 Commands, C6 AI, C7 timing presentation, C8 submission review, C9 broad
  accessibility hardening, and C10 polish remain deferred.
