import json
import os
import re

TRANSCRIPT = r"C:\Users\ENDUSER\.cursor\projects\d-harris-library\agent-transcripts\d428dcf9-9869-4b6e-8a42-560650a949c6\d428dcf9-9869-4b6e-8a42-560650a949c6.jsonl"
ROOT = r"d:\harris-library"

files = {}
with open(TRANSCRIPT, encoding="utf-8") as f:
    for line in f:
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        if obj.get("role") != "assistant":
            continue
        for part in obj.get("message", {}).get("content", []):
            if part.get("type") == "tool_use" and part.get("name") == "Write":
                inp = part.get("input", {})
                path = inp.get("path", "")
                contents = inp.get("contents", "")
                if "harris-library" in path and not path.endswith(".md"):
                    rel = path.replace("d:\\harris-library\\", "").replace("d:/harris-library/", "")
                    files[rel] = contents

skip = {"prisma/schema.prisma", "package.json", "src/generated"}
for rel, contents in sorted(files.items()):
    if any(rel.startswith(s) for s in skip):
        continue
    out = os.path.join(ROOT, rel.replace("\\", os.sep))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write(contents)
    print(f"Wrote {rel}")

print(f"\nTotal: {len(files)}")
