#!/usr/bin/env sh
# Installs, type-checks and tests every step folder and final/, one after the other.
#
# Usage (from anywhere):
#   scripts/verify-all.sh            check everything
#   scripts/verify-all.sh --clean    also delete node_modules/, coverage/ and reports/ afterwards
#
# Needs Node.js 24 or 26 and npm. Docker must be running for the projects that have
# integration tests (lesson 20 on): `npm run test:integration` starts PostgreSQL with Testcontainers.

set -u

cd "$(dirname "$0")/.." || exit 1

clean=0
if [ "${1:-}" = "--clean" ]; then
    clean=1
fi

passed=0
failed=0
failed_list=""

check() {
    npm ci --no-audit --no-fund &&
    npm run typecheck --if-present &&
    npm test &&
    npm run test:integration --if-present
}

for dir in steps/*/ final/; do
    [ -f "$dir/package.json" ] || continue
    echo "==> $dir"
    if (cd "$dir" && check > /dev/null 2>&1); then
        echo "    PASS"
        passed=$((passed + 1))
    else
        echo "    FAIL (run the commands in $dir to see why)"
        failed=$((failed + 1))
        failed_list="$failed_list $dir"
    fi
    if [ "$clean" -eq 1 ]; then
        rm -rf "$dir/node_modules" "$dir/coverage" "$dir/reports" "$dir/.stryker-tmp"
    fi
done

echo
echo "Passed: $passed  Failed: $failed"
if [ "$failed" -gt 0 ]; then
    echo "Failed projects:$failed_list"
    exit 1
fi
