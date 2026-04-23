"""
Pablo IA — NotebookLM Full Automation
Runs after: notebooklm login

Creates notebooks for all projects, adds all sources, generates every artifact type.
Artifacts are saved to notebooklm/outputs/
"""

import asyncio
import os
import sys
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────────────────

SOURCES_DIR = Path(__file__).parent / "sources"
OUTPUTS_DIR = Path(__file__).parent / "outputs"
OUTPUTS_DIR.mkdir(exist_ok=True)

# Populate this list with one entry per project you want NotebookLM to research.
# Each entry: name (notebook title), sources (filenames in sources/), artifacts
# (which to generate: report, mind-map, audio, slide-deck, flashcards, quiz,
# infographic, data-table), and questions (asked against the notebook contents).
#
# Example shape — uncomment and edit per project:
#   {
#       "name": "<project> — <short label>",
#       "sources": ["<filename-in-sources-dir>.md"],
#       "artifacts": ["report", "mind-map", "audio", "slide-deck", "flashcards", "quiz"],
#       "questions": ["..."],
#   },
NOTEBOOKS: list[dict] = []

ARTIFACT_DOWNLOAD_MAP = {
    "audio": "audio",
    "slide-deck": "slide-deck",
    "report": "report",
    "data-table": "data-table",
    "flashcards": "flashcards",
    "infographic": "infographic",
    "mind-map": "mind-map",
    "quiz": "quiz",
}

# ── Helpers ──────────────────────────────────────────────────────────────────

def log(msg: str):
    print(f"\n{'─'*60}\n{msg}\n{'─'*60}")


def run(cmd: str) -> tuple[int, str]:
    """Run a shell command, return (returncode, output)."""
    import subprocess
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    combined = result.stdout + result.stderr
    if result.returncode != 0:
        print(f"  ⚠ Command failed: {cmd}\n  {combined.strip()}")
    else:
        print(f"  ✓ {cmd.split()[1] if len(cmd.split()) > 1 else cmd}")
    return result.returncode, combined.strip()


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    if not NOTEBOOKS:
        print("NOTEBOOKS list is empty. Edit this file and declare your notebooks first.")
        sys.exit(0)

    # ── 0. Auth check ────────────────────────────────────────────────────────
    log("0. Checking authentication")
    code, out = run("notebooklm auth check")
    if code != 0 or "not logged in" in out.lower() or "error" in out.lower():
        print("\n❌ Not authenticated. Run: notebooklm login\nThen re-run this script.")
        sys.exit(1)
    print(f"  Auth: {out}")

    # ── 1. List existing notebooks ───────────────────────────────────────────
    log("1. Listing existing notebooks")
    run("notebooklm list")

    results = {}

    for nb_config in NOTEBOOKS:
        nb_name = nb_config["name"]
        nb_slug = nb_name.lower().replace(" ", "-").replace("—", "").replace("  ", "-")
        nb_out_dir = OUTPUTS_DIR / nb_slug
        nb_out_dir.mkdir(exist_ok=True)

        log(f"📓 Notebook: {nb_name}")

        # ── 2. Create notebook ───────────────────────────────────────────────
        print(f"\n  Creating notebook...")
        code, out = run(f'notebooklm create "{nb_name}"')

        # Use the notebook by name
        run(f'notebooklm use "{nb_name}"')

        # ── 3. Add sources ───────────────────────────────────────────────────
        print(f"\n  Adding sources...")
        for source_file in nb_config["sources"]:
            source_path = SOURCES_DIR / source_file
            if source_path.exists():
                run(f'notebooklm source add "{source_path}"')
            else:
                print(f"  ⚠ Source not found: {source_path}")

        # Wait for sources to process
        print("\n  Waiting for sources to process...")
        run("notebooklm source wait")

        # ── 4. Get notebook summary ──────────────────────────────────────────
        print(f"\n  Getting notebook summary...")
        code, summary = run(f'notebooklm summary')
        summary_path = nb_out_dir / "summary.txt"
        summary_path.write_text(summary)
        print(f"  → Saved to {summary_path}")

        # ── 5. Ask questions ─────────────────────────────────────────────────
        print(f"\n  Asking questions...")
        qa_path = nb_out_dir / "qa.md"
        qa_content = f"# Q&A — {nb_name}\n\n"
        for question in nb_config["questions"]:
            print(f"  Q: {question[:60]}...")
            code, answer = run(f'notebooklm ask "{question}"')
            qa_content += f"## {question}\n\n{answer}\n\n---\n\n"
        qa_path.write_text(qa_content)
        print(f"  → Saved to {qa_path}")

        # ── 6. Save Q&A as note ──────────────────────────────────────────────
        run(f'notebooklm history save --title "Pablo IA Q&A — {nb_name}"')

        # ── 7. Generate artifacts ────────────────────────────────────────────
        print(f"\n  Generating artifacts: {', '.join(nb_config['artifacts'])}")
        for artifact_type in nb_config["artifacts"]:
            print(f"  → Generating {artifact_type}...")
            run(f"notebooklm generate {artifact_type}")

        # Wait for all artifacts
        print("\n  Waiting for artifacts to complete...")
        run("notebooklm artifact wait")

        # ── 8. List + download artifacts ─────────────────────────────────────
        print(f"\n  Downloading artifacts...")
        run("notebooklm artifact list")
        for artifact_type in nb_config["artifacts"]:
            if artifact_type in ARTIFACT_DOWNLOAD_MAP:
                out_path = nb_out_dir / artifact_type
                out_path.mkdir(exist_ok=True)
                run(f"notebooklm download {artifact_type} --output-dir {out_path}")

        # ── 9. Export metadata ───────────────────────────────────────────────
        meta_path = nb_out_dir / "metadata.json"
        run(f"notebooklm metadata --output {meta_path}")

        # ── 10. Artifact suggestions ─────────────────────────────────────────
        code, suggestions = run("notebooklm artifact suggestions")
        suggestions_path = nb_out_dir / "suggestions.txt"
        suggestions_path.write_text(suggestions)

        results[nb_name] = {
            "output_dir": str(nb_out_dir),
            "artifacts_generated": nb_config["artifacts"],
            "questions_answered": len(nb_config["questions"]),
        }

        print(f"\n  ✅ {nb_name} complete → {nb_out_dir}")

    # ── Final summary ─────────────────────────────────────────────────────────
    log("✅ ALL NOTEBOOKS COMPLETE")
    for name, data in results.items():
        print(f"\n  📓 {name}")
        print(f"     Output: {data['output_dir']}")
        print(f"     Artifacts: {', '.join(data['artifacts_generated'])}")
        print(f"     Q&A answered: {data['questions_answered']} questions")

    print(f"\n  All outputs in: {OUTPUTS_DIR}")


if __name__ == "__main__":
    main()
