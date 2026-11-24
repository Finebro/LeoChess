#!/usr/bin/env bash
# Builds the page and runs all browser tests.
set -e
cd "$(dirname "$0")/.."
python3 scripts/build.py
cd tests
python3 test_training.py
python3 test_middlegame.py
python3 test_analysis.py
python3 test_ui.py
python3 test_play.py
python3 test_puzzles.py
