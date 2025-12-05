#!/bin/bash
# ============================================================
# Local maintainer/dev helper script for afi-core.
# NOT part of runtime logic; NOT required for droids or automation.
# Initializes a fresh repo clone (git init + initial push). Use with care.
# ============================================================
git init
git remote add origin git@github.com:AFI-Protocol/afi-core.git
git add .
git commit -m "Initial commit for afi-core"
git push -u origin main
