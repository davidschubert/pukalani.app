#!/usr/bin/env bash
# Selbstheilung VOR pm2 startOrReload — laeuft server-seitig im Deploy
# (deploy.yml), Aufruf: bash pm2-heal.sh <pm2-name>
#
# WARUM (3. pm2-Falle, 2026-07-26): pm2 friert Prozess-Metadaten des
# Erststarts ein, die ein reload NIE aktualisiert. Nach Script-Pfad (Falle 2)
# hat uns das cwd erwischt: ohne explizites cwd in der Ecosystem-Datei merkt
# sich pm2 das Shell-cwd des ERSTSTARTS — hier /home/ploi/studio.pukalani.app.
# Als das Verzeichnis beim Cutover-Aufraeumen verschwand, schlug jeder Spawn
# mit ENOENT fehl: portfolio errored, 90 Restarts, Site down (502).
#
# Ein errored-Prozess oder ein gespeicherter cwd, den es nicht mehr gibt,
# wird deshalb geloescht — der folgende startOrReload startet frisch aus der
# Ecosystem-Datei (die seitdem cwd: CURRENT setzt). Kein ZDT-Verlust: so ein
# Prozess ist ohnehin tot bzw. stirbt beim naechsten Respawn.
set -eu

NAME="$1"

# UMBENANNTE VORGAENGER (Site-Rename 2026-08-18): pm2 startOrReload findet
# Prozesse ueber den NAMEN — nach einer Umbenennung startet es also DANEBEN
# statt zu ersetzen (zwei Prozesse, ein Port, gemischte Builds; beim
# studio→control-Rename gemessen). Der Heiler raeumt deshalb den Altnamen
# weg, BEVOR startOrReload laeuft. Idempotent: existiert der Altname nicht
# (Normalfall ab dem zweiten Deploy), passiert nichts. Der Eintrag darf
# bleiben, bis der Altname sicher aus jedem pm2-Dump verschwunden ist.
LEGACY=""
case "$NAME" in
  adminpukalaniapp) LEGACY="controlpukalaniapp" ;;
esac
if [ -n "$LEGACY" ] && pm2 describe "$LEGACY" >/dev/null 2>&1; then
  echo "[$NAME] Vorgaenger $LEGACY gefunden — wird geloescht (Site-Rename), startOrReload uebernimmt den Port"
  pm2 delete "$LEGACY"
fi

INFO=$(pm2 jlist 2>/dev/null | node -e '
let raw = ""
process.stdin.on("data", chunk => raw += chunk).on("end", () => {
  // jlist mischt gelegentlich [PM2]-Log-Zeilen vor das JSON
  const start = raw.indexOf("[{") !== -1 ? raw.indexOf("[{") : raw.indexOf("[]")
  const list = start === -1 ? [] : JSON.parse(raw.slice(start))
  const proc = list.find(p => p.name === process.argv[1])
  if (!proc) { console.log("absent -"); return }
  console.log(`${proc.pm2_env.status} ${proc.pm2_env.pm_cwd || "-"}`)
})' "$NAME")

STATUS=${INFO%% *}
CWD=${INFO#* }

if [ "$STATUS" = "absent" ]; then
  exit 0
fi
if [ "$STATUS" = "errored" ] || { [ "$CWD" != "-" ] && [ ! -d "$CWD" ]; }; then
  echo "[$NAME] status=$STATUS cwd=$CWD — Prozess wird geloescht, startOrReload startet frisch"
  pm2 delete "$NAME"
fi
