# R1 — Workspace File Boundary Hardening

## Root cause

F-05 was valid: `DockerSandboxAdapter` rejected textual traversal but then read
with `cat /workspace/<path>` and wrote with `mkdir -p` plus shell redirection.
Those operations follow leaf and parent symlinks, so a candidate-controlled
link could cause the File API to access another location in the container.

## Containment policy

The Docker sandbox is the sole enforcement boundary. A supplied path must be a
non-empty workspace-relative path with no backslashes or `..`. For reads, the
adapter opens the target, resolves that opened descriptor, and permits only a
regular file whose resolved target is below the canonical `/workspace` root.
The descriptor is then read directly, so link replacement after validation does
not change the read target.

For writes, the adapter opens and validates each parent directory descriptor
before creating a missing directory or a temporary file. Each resolved parent
must remain below canonical `/workspace`. It rejects symlink and directory
leaves. Content is written through a no-clobber temporary descriptor, then
linked into the pinned parent after removing the ordinary leaf; link creation
does not follow a replacement symlink.

## Behavior

Internal symlinks are supported for reads when their resolved regular-file
target remains inside `/workspace`. Writes through any leaf symlink are
rejected explicitly; writes through an internal parent symlink remain allowed
only when that parent resolves within `/workspace`. Tree enumeration remains
unchanged: links can appear, but an escaping link cannot be read or saved.

This is container-workspace containment only. It does not claim to correct a
Docker or host-filesystem escape; candidate commands remain intentionally
unrestricted inside the assessment container.

## Tests and verification

Added `tests/integration/workspace-file-boundary.test.ts` with one real Docker
integration test covering normal reads/writes, traversal and absolute-path
rejection, internal links, external leaf and parent links, a symlink chain,
directory targets, new contained files, and tree listing continuity.

The focused test and the Docker-backed candidate regressions could not start:
this environment is denied `/var/run/docker.sock` access. `npm run format`,
`npm run lint`, and `npm run typecheck` passed. No candidate UI, lifecycle,
finality, command, evidence, or evaluator behavior changed.
