#!/bin/sh
set -e

git -c safe.directory='*' -C /opt/delimit/repo-template rev-parse HEAD^{tree}
