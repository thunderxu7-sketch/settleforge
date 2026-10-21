#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
task_root="$(pwd)"
mkdir -p .local/softhsm/tokens
chmod 700 .local/softhsm .local/softhsm/tokens
printf 'directories.tokendir = %s/.local/softhsm/tokens\nobjectstore.backend = file\nlog.level = ERROR\nslots.removable = false\n' "$task_root" > .local/softhsm/softhsm2.conf
export SOFTHSM2_CONF="$task_root/.local/softhsm/softhsm2.conf"
task_module=""
for candidate in /opt/homebrew/lib/softhsm/libsofthsm2.so /usr/lib/softhsm/libsofthsm2.so /usr/lib/x86_64-linux-gnu/softhsm/libsofthsm2.so; do
  if [[ -f "$candidate" ]]; then task_module="$candidate"; break; fi
done
if [[ -z "$task_module" ]]; then echo 'Install SoftHSM first.' >&2; exit 1; fi
# Public test-only PINs. Re-running preserves the existing test token.
if ! softhsm2-util --show-slots | rg -q SettleForge-test; then
  softhsm2-util --init-token --free --label SettleForge-test --so-pin 12345678 --pin 98765432
fi
printf 'export SOFTHSM2_CONF=%q\nexport TEST_PKCS11_MODULE=%q\nexport TEST_PKCS11_PIN=98765432\n' "$SOFTHSM2_CONF" "$task_module" > .local/softhsm/test.env
chmod 600 .local/softhsm/softhsm2.conf .local/softhsm/test.env
echo 'Test token ready. Source .local/softhsm/test.env to run PKCS#11 acceptance.'
