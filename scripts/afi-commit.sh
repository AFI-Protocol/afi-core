#!/bin/zsh

echo "✏️ Starting AFI Commit Process..."

cd ~/AFI_Modular_Repos/afi-core || { echo "❌ Cannot find afi-core"; exit 1; }

CHANGES=$(git status --porcelain)

if [ -z "$CHANGES" ]; then
  echo "🟡 No staged changes found. Stage your files first!"
  exit 0
fi

echo "📄 Staged Changes:"
git status --short

echo "💬 Enter your commit message:"
read COMMIT_MSG

git commit -am "$COMMIT_MSG" && git push origin main && echo "🚀 Changes pushed successfully!" || echo "❌ Commit failed. Check for issues."

echo "✅ Commit flow complete."
