#!/bin/sh
set -e

EVIDENCE_DIR="/run/hirearchy-evidence"
INDEX_FILE="${EVIDENCE_DIR}/idx_$(python3 -c 'import uuid; print(uuid.uuid4().hex)')"

# Exception-safe cleanup: remove ephemeral index on exit, error, or signal
cleanup() {
    rm -f "${INDEX_FILE}"
}
trap cleanup EXIT INT TERM HUP

export GIT_DIR="/opt/hirearchy/repo-template/.git"
export GIT_WORK_TREE="/workspace"
export GIT_OBJECT_DIRECTORY="${EVIDENCE_DIR}/objects"
export GIT_ALTERNATE_OBJECT_DIRECTORIES="/opt/hirearchy/repo-template/.git/objects"
export GIT_INDEX_FILE="${INDEX_FILE}"

mkdir -p "${EVIDENCE_DIR}/objects"

# Force-index workspace while respecting only Hirearchy Software-owned recursive exclusion pathspecs
git -c safe.directory='*' add -f -A -- . \
  ':(exclude,top).git' \
  ':(exclude)**/__pycache__/**' \
  ':(exclude)__pycache__/**' \
  ':(exclude)**/*.pyc' \
  ':(exclude)*.pyc' \
  ':(exclude)**/.pytest_cache/**' \
  ':(exclude).pytest_cache/**' \
  ':(exclude)**/*.log' \
  ':(exclude)*.log'

# Write tree to evidence object directory and output hash
TREE_HASH=$(git -c safe.directory='*' write-tree)

echo "${TREE_HASH}"
