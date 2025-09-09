from pathlib import Path
import json

messages = json.loads(Path("../fr.json").read_text(encoding="utf-8"))

for file in Path(".").rglob("*.js"):
    lines = list(file.read_text(encoding="utf-8").splitlines())
    for i, line in enumerate(lines):
        for key in sorted(messages):
            if f"fr.{key}" in line:
                print(f"Updating {file}:{i+1} for key '{key}'")
                lines[i] = line.replace(f"fr.{key}", f'"{messages[key]}"')
    file.write_text("\n".join(lines), encoding="utf-8")
