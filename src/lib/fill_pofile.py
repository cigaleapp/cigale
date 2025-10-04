from pathlib import Path
import json
import re

src = Path(__file__).parent.parent

english = json.loads(Path(src / "messages/en.json").read_text(encoding="utf8"))

pofile = Path(src.parent / "locales" / "fr.po")

for i, line in enumerate(pofile.read_text(encoding="utf8").splitlines()):
    match = re.match(r'msgid "(?P<key>.+)"', line)
    if not match:
        continue

    key = match.group("key")
    message = english.get(key)
    if not message:
        raise ValueError(f"Key {key} not found in English messages")

    print(f"Found {key} in {pofile}:{i+1} -> {line}")
    pofile.write_text(
        pofile.read_text(encoding="utf8").replace(
            f'msgid "{key}"\nmsgstr ""',
            f'msgid "{key}"\nmsgstr "{message.replace('"', r'\"')}"',
        ),
        encoding="utf8",
    )
