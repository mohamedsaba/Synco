// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CandidateWorkspace } from '../../apps/web/app/candidate/[token]/candidate-workspace';
import type { CandidateSessionView } from '../../apps/web/src/sessions/candidate-session-view';

const activeSessionFixture: CandidateSessionView = {
  id: 'session-c9a-interaction-test',
  scenario: {
    id: 'scenario-001',
    title: 'Distributed Inventory Cache',
    version: '1.0.0',
    type: 'single_file',
    brief: 'Correct stale inventory reads.',
    acceptanceCriteria: ['Keep cache entries current.'],
    filePath: 'inventory/service.py',
  },
  status: 'ACTIVE',
  workingContent: 'def get_inventory():\n    return []\n',
  createdAt: '2026-09-22T10:00:00.000Z',
  activatedAt: '2026-09-22T10:01:00.000Z',
  submittedAt: null,
  durationSeconds: 3600,
  deadline: '2026-09-23T10:01:00.000Z',
  serverTime: '2026-09-22T10:01:00.000Z',
  closureReason: null,
  scenarioType: 'single_file',
  aiCapability: { enabled: true },
};

/**
 * Realistic keyboard activation for native buttons in DOM environments.
 * Dispatches keydown; if not prevented, triggers native click activation, followed by keyup.
 */
function activateButtonWithKeyboard(
  button: HTMLButtonElement,
  key: 'Enter' | ' ',
) {
  const code = key === ' ' ? 'Space' : 'Enter';
  const eventInit = { key, code, bubbles: true, cancelable: true };
  const notPrevented = button.dispatchEvent(
    new KeyboardEvent('keydown', eventInit),
  );
  if (notPrevented) {
    button.click();
  }
  button.dispatchEvent(new KeyboardEvent('keyup', eventInit));
}

/**
 * Updates an input or textarea value via its prototype setter to trigger React controlled inputs.
 */
function setInputValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  descriptor?.set?.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Flushes asynchronous requestAnimationFrame callbacks scheduled by focus management.
 */
async function flushAnimationFrames() {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  });
}

describe('C9A — Candidate workspace interactive navigation and focus', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    (
      globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ files: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
      root = null;
    }
    if (container) {
      container.remove();
      container = null;
    }
    vi.restoreAllMocks();
  });

  const renderWorkspace = async (
    session: CandidateSessionView = activeSessionFixture,
  ) => {
    await act(async () => {
      root?.render(
        <CandidateWorkspace initialSession={session} token="c9a-token" />,
      );
    });
    await flushAnimationFrames();
  };

  const getNavButtons = () => {
    const nav = container?.querySelector<HTMLElement>(
      'nav.workspace-navigation',
    );
    expect(nav).not.toBeNull();
    const buttons = Array.from(
      nav!.querySelectorAll<HTMLButtonElement>('button'),
    );
    const map = new Map<string, HTMLButtonElement>();
    for (const btn of buttons) {
      map.set(btn.textContent?.trim() ?? '', btn);
    }
    return { nav: nav!, buttons, map };
  };

  const getWorkspaceGrid = () => {
    const grid = container?.querySelector<HTMLDivElement>('div.workspace-grid');
    expect(grid).not.toBeNull();
    return grid!;
  };

  it('renders workspace navigation controls in the DOM with correct initial state', async () => {
    await renderWorkspace();

    const { nav, buttons, map } = getNavButtons();
    expect(nav.getAttribute('aria-label')).toBe('Workspace navigation');
    expect(buttons).toHaveLength(5);
    expect(Array.from(map.keys())).toEqual([
      'Scenario',
      'Files',
      'Editor',
      'Commands',
      'AI',
    ]);

    // Initial panel is editor
    const editorBtn = map.get('Editor')!;
    expect(editorBtn.getAttribute('aria-current')).toBe('page');
    expect(editorBtn.getAttribute('aria-controls')).toBe('workspace-editor');

    // Non-active buttons do not have aria-current="page"
    for (const [label, btn] of map.entries()) {
      if (label !== 'Editor') {
        expect(btn.getAttribute('aria-current')).toBeNull();
      }
    }

    const grid = getWorkspaceGrid();
    expect(grid.className).toContain('workspace-view-editor');
  });

  it('allows navigation controls to receive DOM focus', async () => {
    await renderWorkspace();

    const { map } = getNavButtons();
    const scenarioBtn = map.get('Scenario')!;

    scenarioBtn.focus();
    expect(document.activeElement).toBe(scenarioBtn);

    const commandsBtn = map.get('Commands')!;
    commandsBtn.focus();
    expect(document.activeElement).toBe(commandsBtn);
  });

  it('switches to Scenario surface upon click, updating semantic state and DOM view class', async () => {
    await renderWorkspace();

    const { map } = getNavButtons();
    const scenarioBtn = map.get('Scenario')!;

    await act(async () => {
      scenarioBtn.click();
    });
    await flushAnimationFrames();

    expect(scenarioBtn.getAttribute('aria-current')).toBe('page');
    expect(map.get('Editor')!.getAttribute('aria-current')).toBeNull();

    const grid = getWorkspaceGrid();
    expect(grid.className).toContain('workspace-view-scenario');
    expect(grid.className).not.toContain('workspace-view-editor');

    const scenarioSection = container?.querySelector('#workspace-scenario');
    expect(scenarioSection).not.toBeNull();
  });

  it('switches to Files surface upon click, targeting workspace-editor panel', async () => {
    await renderWorkspace();

    const { map } = getNavButtons();
    const filesBtn = map.get('Files')!;

    await act(async () => {
      filesBtn.click();
    });
    await flushAnimationFrames();

    expect(filesBtn.getAttribute('aria-current')).toBe('page');
    expect(filesBtn.getAttribute('aria-controls')).toBe('workspace-editor');
    expect(map.get('Editor')!.getAttribute('aria-current')).toBeNull();

    const grid = getWorkspaceGrid();
    expect(grid.className).toContain('workspace-view-files');
  });

  it('switches to Editor surface upon click', async () => {
    await renderWorkspace();

    const { map } = getNavButtons();
    const scenarioBtn = map.get('Scenario')!;
    const editorBtn = map.get('Editor')!;

    // Navigate away first
    await act(async () => {
      scenarioBtn.click();
    });
    await flushAnimationFrames();
    expect(scenarioBtn.getAttribute('aria-current')).toBe('page');

    // Navigate back to Editor
    await act(async () => {
      editorBtn.click();
    });
    await flushAnimationFrames();

    expect(editorBtn.getAttribute('aria-current')).toBe('page');
    expect(scenarioBtn.getAttribute('aria-current')).toBeNull();

    const grid = getWorkspaceGrid();
    expect(grid.className).toContain('workspace-view-editor');
  });

  it('switches to Commands surface upon click', async () => {
    await renderWorkspace();

    const { map } = getNavButtons();
    const commandsBtn = map.get('Commands')!;

    await act(async () => {
      commandsBtn.click();
    });
    await flushAnimationFrames();

    expect(commandsBtn.getAttribute('aria-current')).toBe('page');
    expect(commandsBtn.getAttribute('aria-controls')).toBe(
      'workspace-commands',
    );
    expect(map.get('Editor')!.getAttribute('aria-current')).toBeNull();

    const grid = getWorkspaceGrid();
    expect(grid.className).toContain('workspace-view-commands');
  });

  it('switches to AI surface upon click', async () => {
    await renderWorkspace();

    const { map } = getNavButtons();
    const aiBtn = map.get('AI')!;

    await act(async () => {
      aiBtn.click();
    });
    await flushAnimationFrames();

    expect(aiBtn.getAttribute('aria-current')).toBe('page');
    expect(aiBtn.getAttribute('aria-controls')).toBe('workspace-ai');
    expect(map.get('Editor')!.getAttribute('aria-current')).toBeNull();

    const grid = getWorkspaceGrid();
    expect(grid.className).toContain('workspace-view-ai');
  });

  it('activates focused navigation button using Enter key without losing focus', async () => {
    await renderWorkspace();

    const { map } = getNavButtons();
    const commandsBtn = map.get('Commands')!;

    commandsBtn.focus();
    expect(document.activeElement).toBe(commandsBtn);

    await act(async () => {
      activateButtonWithKeyboard(commandsBtn, 'Enter');
    });
    await flushAnimationFrames();

    expect(commandsBtn.getAttribute('aria-current')).toBe('page');
    expect(getWorkspaceGrid().className).toContain('workspace-view-commands');

    // Navigation must not unexpectedly shift focus to an unrelated control
    expect(document.activeElement).toBe(commandsBtn);
  });

  it('activates focused navigation button using Space key without losing focus', async () => {
    await renderWorkspace();

    const { map } = getNavButtons();
    const aiBtn = map.get('AI')!;

    aiBtn.focus();
    expect(document.activeElement).toBe(aiBtn);

    await act(async () => {
      activateButtonWithKeyboard(aiBtn, ' ');
    });
    await flushAnimationFrames();

    expect(aiBtn.getAttribute('aria-current')).toBe('page');
    expect(getWorkspaceGrid().className).toContain('workspace-view-ai');

    // Navigation must not unexpectedly shift focus to an unrelated control
    expect(document.activeElement).toBe(aiBtn);
  });

  it('preserves stateful panels across navigation switches (DOM node identity and state retention)', async () => {
    await renderWorkspace();

    // 1. Mutate editor content
    const editorTextarea = container?.querySelector<HTMLTextAreaElement>(
      '#workspace-editor textarea',
    );
    expect(editorTextarea).not.toBeNull();
    const originalEditorNode = editorTextarea!;

    await act(async () => {
      // Simulate typing into the editor
      setInputValue(
        originalEditorNode,
        'def get_inventory():\n    # modified in test\n    return [42]\n',
      );
    });

    // 2. Mutate command input
    const commandInput = container?.querySelector<HTMLInputElement>(
      'input.terminal-input',
    );
    expect(commandInput).not.toBeNull();
    const originalCommandNode = commandInput!;

    await act(async () => {
      setInputValue(originalCommandNode, 'pytest tests/test_cache.py');
    });

    // 3. Mutate AI prompt input
    const aiPrompt = container?.querySelector<HTMLTextAreaElement>(
      '#candidate-ai-prompt',
    );
    expect(aiPrompt).not.toBeNull();
    const originalAiNode = aiPrompt!;

    await act(async () => {
      setInputValue(originalAiNode, 'Explain the cache eviction logic');
    });

    // Cycle through all navigation panels
    const { map } = getNavButtons();
    const panels: Array<keyof typeof map extends string ? string : never> = [
      'Scenario',
      'Files',
      'Commands',
      'AI',
      'Editor',
    ];

    for (const panelName of panels) {
      const btn = map.get(panelName)!;
      await act(async () => {
        btn.click();
      });
      await flushAnimationFrames();
    }

    // Verify editor DOM node identity and content were preserved
    const currentEditorTextarea = container?.querySelector<HTMLTextAreaElement>(
      '#workspace-editor textarea',
    );
    expect(currentEditorTextarea).toBe(originalEditorNode);
    expect(currentEditorTextarea?.value).toBe(
      'def get_inventory():\n    # modified in test\n    return [42]\n',
    );

    // Verify command input DOM node identity and content were preserved
    const currentCommandInput = container?.querySelector<HTMLInputElement>(
      'input.terminal-input',
    );
    expect(currentCommandInput).toBe(originalCommandNode);
    expect(currentCommandInput?.value).toBe('pytest tests/test_cache.py');

    // Verify AI prompt DOM node identity and content were preserved
    const currentAiPrompt = container?.querySelector<HTMLTextAreaElement>(
      '#candidate-ai-prompt',
    );
    expect(currentAiPrompt).toBe(originalAiNode);
    expect(currentAiPrompt?.value).toBe('Explain the cache eviction logic');
  });

  it('maintains the JavaScript class contract driving single-panel responsive hiding', async () => {
    await renderWorkspace();

    const { map } = getNavButtons();
    const grid = getWorkspaceGrid();

    // Verify all panel classes match the active navigation selection exactly
    const expectedClasses = [
      ['Scenario', 'workspace-view-scenario'],
      ['Files', 'workspace-view-files'],
      ['Editor', 'workspace-view-editor'],
      ['Commands', 'workspace-view-commands'],
      ['AI', 'workspace-view-ai'],
    ] as const;

    for (const [label, expectedClass] of expectedClasses) {
      const btn = map.get(label)!;
      await act(async () => {
        btn.click();
      });
      await flushAnimationFrames();

      expect(grid.className).toContain(expectedClass);
      expect(btn.getAttribute('aria-current')).toBe('page');

      // Verify other navigation buttons are not active
      for (const [otherLabel, otherBtn] of map.entries()) {
        if (otherLabel !== label) {
          expect(otherBtn.getAttribute('aria-current')).toBeNull();
        }
      }
    }
  });

  it('manages submission-review focus, background inertness, and focus restoration on Back', async () => {
    await renderWorkspace();

    const submitBtn = container?.querySelector<HTMLButtonElement>(
      'button.button-primary',
    );
    expect(submitBtn).not.toBeNull();
    expect(submitBtn!.textContent?.trim()).toBe('Submit assessment');

    // 1. Submit button receives focus
    submitBtn!.focus();
    expect(document.activeElement).toBe(submitBtn);

    // 2. Activating submit button opens submission review
    await act(async () => {
      submitBtn!.click();
    });
    await flushAnimationFrames();

    // 3. Submission review heading receives focus
    const reviewHeading = container?.querySelector<HTMLHeadingElement>(
      '#submission-review-title',
    );
    expect(reviewHeading).not.toBeNull();
    expect(document.activeElement).toBe(reviewHeading);

    // 4. Background workspace is marked inert and aria-hidden
    const backgroundWrapper = container?.querySelector('div[inert]');
    expect(backgroundWrapper).not.toBeNull();
    expect(backgroundWrapper?.getAttribute('aria-hidden')).toBe('true');

    // 5. Back button inside submission review closes review and restores focus
    const backBtn = container?.querySelector<HTMLButtonElement>(
      'section.submission-review button.button-secondary',
    );
    expect(backBtn).not.toBeNull();
    expect(backBtn?.textContent?.trim()).toBe('Back');

    await act(async () => {
      backBtn!.click();
    });
    await flushAnimationFrames();

    // Background is no longer inert
    const restoredBackground = container?.querySelector('div[inert]');
    expect(restoredBackground).toBeNull();

    // Focus returns logically to the Submit assessment button
    const restoredSubmitBtn = container?.querySelector<HTMLButtonElement>(
      'button.button-primary',
    );
    expect(restoredSubmitBtn).not.toBeNull();
    expect(document.activeElement).toBe(restoredSubmitBtn);
  });

  it('focuses terminal heading on entering finalizing terminal state', async () => {
    await renderWorkspace({
      ...activeSessionFixture,
      closureReason: 'candidate_submission',
    });

    const finalizingHeading =
      container?.querySelector<HTMLHeadingElement>('#finalizing-title');
    expect(finalizingHeading).not.toBeNull();
    expect(document.activeElement).toBe(finalizingHeading);
  });

  it('provides explicit focus treatment for command terminal input', async () => {
    await renderWorkspace();

    const terminalInput = container?.querySelector<HTMLInputElement>(
      'input.terminal-input',
    );
    expect(terminalInput).not.toBeNull();
    terminalInput?.focus();
    expect(document.activeElement).toBe(terminalInput);

    const workspaceCss = readFileSync(
      path.join(process.cwd(), 'apps/web/app/workspace.css'),
      'utf8',
    );
    expect(workspaceCss).toMatch(
      /\.terminal-form:focus-within\s*\{[^}]*outline:\s*2px\s*solid/,
    );
  });
});
