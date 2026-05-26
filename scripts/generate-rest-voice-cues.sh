#!/usr/bin/env bash
# Vygeneruje Prepare / Work pro odpočet 10×10 (macOS `say`). Spusť z kořene fitdenik/.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)/public/audio/rest"
mkdir -p "$DIR"
say -v Samantha -r 175 -o "$DIR/prepare.aiff" "Prepare"
say -v Samantha -r 190 -o "$DIR/work.aiff" "Work"
afconvert -f WAVE -d LEI16@22050 "$DIR/prepare.aiff" "$DIR/prepare.wav"
afconvert -f WAVE -d LEI16@22050 "$DIR/work.aiff" "$DIR/work.wav"
echo "OK: $DIR/prepare.wav ($(afinfo "$DIR/prepare.wav" 2>&1 | grep 'estimated duration'))"
