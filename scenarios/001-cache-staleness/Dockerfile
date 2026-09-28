FROM hirearchy-musl-builder:3.20 AS supervisor-build
COPY hirearchy-exec-supervisor.c /src/hirearchy-exec-supervisor.c
RUN cc -O2 -Wall -Wextra -Werror -static \
    -o /hirearchy-exec-supervisor /src/hirearchy-exec-supervisor.c

FROM hirearchy-scenario-001-test:latest

# 1. Create unprivileged hirearchy user (1000:1000)
RUN addgroup -g 1000 hirearchy 2>/dev/null || true && \
    adduser -u 1000 -G hirearchy -s /bin/sh -D hirearchy 2>/dev/null || true

# 2. Configure git globally for hirearchy user and system-wide
RUN git config --system --add safe.directory '*' && \
    su hirearchy -c "git config --global user.name 'Candidate' && git config --global user.email 'candidate@hirearchy.local'"

# 3. Pre-initialize PostgreSQL seed cluster as hirearchy user
RUN mkdir -p /var/lib/postgresql/seed_cluster /tmp/pgdata && \
    chown -R hirearchy:hirearchy /var/lib/postgresql /tmp/pgdata && \
    su hirearchy -c "initdb -D /var/lib/postgresql/seed_cluster --auth-local=trust --auth-host=trust -U hirearchy"

# 4. Copy repository and create pre-baked Git baseline commit
COPY repository /opt/hirearchy/repo-template
RUN chown -R hirearchy:hirearchy /opt/hirearchy/repo-template && \
    cd /opt/hirearchy/repo-template && \
    su hirearchy -c "git init && git add . && git commit -m 'baseline scenario state'"

# 5. Install startup and evidence scripts
COPY start_services.sh /usr/local/bin/start_services.sh
COPY hirearchy-capture-tree.sh /usr/local/bin/hirearchy-capture-tree.sh
COPY hirearchy-diff-trees.sh /usr/local/bin/hirearchy-diff-trees.sh
COPY hirearchy-baseline-tree.sh /usr/local/bin/hirearchy-baseline-tree.sh
COPY --from=supervisor-build /hirearchy-exec-supervisor /usr/local/bin/hirearchy-exec-supervisor
RUN chmod +x /usr/local/bin/start_services.sh \
             /usr/local/bin/hirearchy-capture-tree.sh \
             /usr/local/bin/hirearchy-diff-trees.sh \
             /usr/local/bin/hirearchy-baseline-tree.sh \
             /usr/local/bin/hirearchy-exec-supervisor && \
    mkdir -p /run/hirearchy-evidence && \
    chmod 700 /run/hirearchy-evidence

ENV PYTHONPATH=/workspace
USER hirearchy
WORKDIR /workspace
CMD ["/usr/local/bin/start_services.sh"]
