#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
task_root="$(pwd)"
task_lab_dir="${SOFTHSM_LAB_DIR:-$task_root/.local/softhsm}"
mkdir -p "$task_lab_dir/tokens"
task_lab_dir="$(cd "$task_lab_dir" && pwd)"
chmod 700 "$task_lab_dir" "$task_lab_dir/tokens"
printf 'directories.tokendir = %s/tokens\nobjectstore.backend = file\nlog.level = ERROR\nslots.removable = false\n' "$task_lab_dir" > "$task_lab_dir/softhsm2.conf"
export SOFTHSM2_CONF="$task_lab_dir/softhsm2.conf"
task_module=""
for candidate in /opt/homebrew/lib/softhsm/libsofthsm2.so /usr/lib/softhsm/libsofthsm2.so /usr/lib/x86_64-linux-gnu/softhsm/libsofthsm2.so; do
  if [[ -f "$candidate" ]]; then task_module="$candidate"; break; fi
done
if [[ -z "$task_module" ]]; then echo 'Install SoftHSM first.' >&2; exit 1; fi
# Public test-only PINs. Re-running preserves the existing test token.
if ! softhsm2-util --show-slots | rg -q SettleForge-test; then
  softhsm2-util --init-token --free --label SettleForge-test --so-pin 12345678 --pin 98765432
fi
printf 'export SOFTHSM2_CONF=%q\nexport TEST_PKCS11_MODULE=%q\nexport TEST_PKCS11_PIN=98765432\n' "$SOFTHSM2_CONF" "$task_module" > "$task_lab_dir/test.env"
python3 - "$task_lab_dir" "$task_module" <<'PY'
import json,sys
from pathlib import Path
folder=Path(sys.argv[1])
(folder/'runtime.json').write_text(json.dumps({'config':str(folder/'softhsm2.conf'),'module':sys.argv[2],'token_label':'SettleForge-test'})+'\n')
PY
chmod 600 "$task_lab_dir/softhsm2.conf" "$task_lab_dir/test.env" "$task_lab_dir/runtime.json"
echo "Test token ready. Environment file: $task_lab_dir/test.env"
