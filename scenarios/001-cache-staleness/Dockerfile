FROM delimit-scenario-001-test:latest

# 1. Create unprivileged delimit user (1000:1000)
RUN addgroup -g 1000 delimit 2>/dev/null || true && \
    adduser -u 1000 -G delimit -s /bin/sh -D delimit 2>/dev/null || true

# 2. Configure git globally for delimit user and system-wide
RUN git config --system --add safe.directory '*' && \
    su delimit -c "git config --global user.name 'Candidate' && git config --global user.email 'candidate@delimit.local'"

# 3. Pre-initialize PostgreSQL seed cluster as delimit user
RUN mkdir -p /var/lib/postgresql/seed_cluster /tmp/pgdata && \
    chown -R delimit:delimit /var/lib/postgresql /tmp/pgdata && \
    su delimit -c "initdb -D /var/lib/postgresql/seed_cluster --auth-local=trust --auth-host=trust -U delimit"

# 4. Copy repository and create pre-baked Git baseline commit
COPY repository /opt/delimit/repo-template
RUN chown -R delimit:delimit /opt/delimit/repo-template && \
    cd /opt/delimit/repo-template && \
    su delimit -c "git init && git add . && git commit -m 'baseline scenario state'"

# 5. Install startup and evidence scripts
COPY start_services.sh /usr/local/bin/start_services.sh
COPY delimit-capture-tree.sh /usr/local/bin/delimit-capture-tree.sh
COPY delimit-diff-trees.sh /usr/local/bin/delimit-diff-trees.sh
COPY delimit-baseline-tree.sh /usr/local/bin/delimit-baseline-tree.sh
RUN chmod +x /usr/local/bin/start_services.sh \
             /usr/local/bin/delimit-capture-tree.sh \
             /usr/local/bin/delimit-diff-trees.sh \
             /usr/local/bin/delimit-baseline-tree.sh && \
    mkdir -p /run/delimit-evidence && \
    chmod 700 /run/delimit-evidence

ENV PYTHONPATH=/workspace
USER delimit
WORKDIR /workspace
CMD ["/usr/local/bin/start_services.sh"]
