#!/usr/bin/env bash

set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$BACKEND_DIR/.mariadb-data"
RUN_DIR="$BACKEND_DIR/.mariadb-run"
SOCKET="$RUN_DIR/mariadb.sock"
PID_FILE="$RUN_DIR/mariadb.pid"
LOG_FILE="$RUN_DIR/mariadb.log"
PORT="${LOCAL_DB_PORT:-3307}"
UNIT_NAME="mentor-market-mariadb.service"

is_running() {
  systemctl --user is-active --quiet "$UNIT_NAME"
}

initialize() {
  mkdir -p "$DATA_DIR" "$RUN_DIR"
  if [[ ! -d "$DATA_DIR/mysql" ]]; then
    echo "Initializing project-local MariaDB data directory..."
    mariadb-install-db \
      --no-defaults \
      --auth-root-authentication-method=normal \
      --skip-test-db \
      --datadir="$DATA_DIR" >/dev/null
  fi
}

create_app_user() {
  mariadb --no-defaults --socket="$SOCKET" --user=root <<'SQL'
CREATE USER IF NOT EXISTS 'mentor_market_app'@'127.0.0.1' IDENTIFIED BY 'MentorMarketLocal2026';
ALTER USER 'mentor_market_app'@'127.0.0.1' IDENTIFIED BY 'MentorMarketLocal2026';
GRANT ALL PRIVILEGES ON mentor_market.* TO 'mentor_market_app'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
}

apply_migrations() {
  local migration
  for migration in "$BACKEND_DIR"/database/migrations/*.sql; do
    [[ -e "$migration" ]] || continue
    mariadb --no-defaults --socket="$SOCKET" --user=root < "$migration"
  done
}

bootstrap_database() {
  local database_exists
  database_exists="$(mariadb --no-defaults --socket="$SOCKET" --user=root --skip-column-names \
    --execute="SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'mentor_market'")"
  if [[ "$database_exists" == "0" ]]; then
    echo "Loading Mentor Market schema and seed data..."
    mariadb --no-defaults --socket="$SOCKET" --user=root < "$BACKEND_DIR/database/schema.sql"
    mariadb --no-defaults --socket="$SOCKET" --user=root < "$BACKEND_DIR/database/seed.sql"
  fi
  apply_migrations
  create_app_user
}

start_database() {
  initialize
  if is_running; then
    echo "Project database is already running on port $PORT."
    bootstrap_database
    return
  fi

  rm -f "$SOCKET" "$PID_FILE"
  systemctl --user reset-failed "$UNIT_NAME" 2>/dev/null || true
  systemd-run \
    --user \
    --unit="$UNIT_NAME" \
    --collect \
    --property=Restart=on-failure \
    --property=RestartSec=2s \
    --working-directory="$BACKEND_DIR" \
    mariadbd \
    --no-defaults \
    --datadir="$DATA_DIR" \
    --socket="$SOCKET" \
    --pid-file="$PID_FILE" \
    --port="$PORT" \
    --bind-address=127.0.0.1 \
    --skip-name-resolve \
    --log-error="$LOG_FILE" \
    >/dev/null

  for _ in {1..30}; do
    if mariadb-admin --no-defaults --socket="$SOCKET" --user=root ping --silent 2>/dev/null; then
      echo "Project database started on 127.0.0.1:$PORT."
      bootstrap_database
      return
    fi
    sleep 0.25
  done

  echo "Database failed to start. See $LOG_FILE" >&2
  tail -n 20 "$LOG_FILE" >&2 || true
  exit 1
}

reset_database() {
  start_database
  echo "Resetting Mentor Market schema and seed data..."
  mariadb --no-defaults --socket="$SOCKET" --user=root < "$BACKEND_DIR/database/schema.sql"
  mariadb --no-defaults --socket="$SOCKET" --user=root < "$BACKEND_DIR/database/seed.sql"
  create_app_user
  echo "Project database reset complete."
}

stop_database() {
  if ! is_running; then
    echo "Project database is not running."
    return
  fi
  mariadb-admin --no-defaults --socket="$SOCKET" --user=root shutdown
  systemctl --user stop "$UNIT_NAME" 2>/dev/null || true
  echo "Project database stopped."
}

show_status() {
  if is_running; then
    echo "Project database is running on 127.0.0.1:$PORT (PID $(cat "$PID_FILE"))."
  else
    echo "Project database is stopped."
    exit 1
  fi
}

case "${1:-start}" in
  start) start_database ;;
  stop) stop_database ;;
  status) show_status ;;
  reset) reset_database ;;
  *) echo "Usage: $0 {start|stop|status|reset}" >&2; exit 2 ;;
esac
