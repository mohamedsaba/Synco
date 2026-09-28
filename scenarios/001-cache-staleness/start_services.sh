#!/bin/sh
set -e

# 1. Populate /workspace from pre-baked template
if [ -d "/opt/hirearchy/repo-template" ]; then
    cp -a /opt/hirearchy/repo-template/. /workspace/
fi

# 2. Populate PostgreSQL data directory in /tmp/pgdata
mkdir -p /tmp/pgdata
chmod 700 /tmp/pgdata
if [ -d "/var/lib/postgresql/seed_cluster" ]; then
    cp -a /var/lib/postgresql/seed_cluster/. /tmp/pgdata/
fi

# 3. Start PostgreSQL
postgres -D /tmp/pgdata -k /tmp -h 127.0.0.1 -p 5432 > /tmp/postgres.log 2>&1 &
until pg_isready -h 127.0.0.1 -p 5432 -U hirearchy -q; do
    sleep 0.1
done

createdb -h 127.0.0.1 -p 5432 -U hirearchy inventory 2>/dev/null || true

# 4. Start Redis
redis-server --daemonize yes --port 6379 --bind 127.0.0.1 --dir /tmp --logfile /tmp/redis.log

# 5. Run seed script to create tables and seed Redis + Postgres
python3 /workspace/scripts/seed_data.py

# 6. Start Flask app on 127.0.0.1:8000
python3 /workspace/app.py > /tmp/flask.log 2>&1 &

# 7. Write readiness indicator
echo "READY" > /tmp/scenario_ready

# 8. Sleep infinity as PID 1
exec sleep infinity
