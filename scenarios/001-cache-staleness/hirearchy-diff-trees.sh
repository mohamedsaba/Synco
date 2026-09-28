#!/bin/sh
set -e

BEFORE_TREE="$1"
AFTER_TREE="$2"

EVIDENCE_DIR="/run/hirearchy-evidence"

export GIT_DIR="/opt/hirearchy/repo-template/.git"
export GIT_WORK_TREE="/workspace"
export GIT_OBJECT_DIRECTORY="${EVIDENCE_DIR}/objects"
export GIT_ALTERNATE_OBJECT_DIRECTORIES="/opt/hirearchy/repo-template/.git/objects"

# Output numstat and raw patch between two tree hashes
git -c safe.directory='*' diff --numstat "${BEFORE_TREE}" "${AFTER_TREE}"
echo "---HIREARCHY_DIFF_BOUNDARY---"
git -c safe.directory='*' diff "${BEFORE_TREE}" "${AFTER_TREE}"
