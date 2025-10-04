import json
from pathlib import Path
import re

here = Path(__file__).parent
src = here.parent

files_to_edit = Path(src).glob("**/*.{js,svelte}")
messages: dict[str, str] = json.loads(
    Path(src.parent / "messages/fr.json").read_text(encoding="utf8")
)

paraglide_call_pattern = re.compile(r"\bm\.(?P<key>[a-z0-9_]+)\(\)")


# ANSI bold for terminal
def bold(text: str) -> str:
    return f"\033[1m{text}\033[0m"


for file in files_to_edit:
    for line_no, line in enumerate(file.read_text(encoding="utf8").splitlines()):
        for call in paraglide_call_pattern.finditer(line):
            print(
                f'Found {call.group("key")} in {file}:{line_no+1} -> {line.replace(call.group(0), bold(call.group(0)))}'
            )
            message = messages.get(call.group("key"))
            if not message:
                raise ValueError(f"Key {call.group('key')} not found in messages")
            line = line.replace(call.group(0), f"'{message.replace("'", r"\'")}'")
