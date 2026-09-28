#!/bin/sh
set -e

git -c safe.directory='*' -C /opt/hirearchy/repo-template rev-parse HEAD^{tree}
