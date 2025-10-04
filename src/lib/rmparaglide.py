import json
from pathlib import Path
import re

here = Path(__file__).parent
src = here.parent

messages: dict[str, str] = json.loads(
    Path(src.parent / "messages/fr.json").read_text(encoding="utf8")
)

paraglide_call_pattern = re.compile(r"\bm\.(?P<key>[a-z0-9_]+)\(\)")


def process_directory(directory: Path):
    for file in directory.glob("*"):
        if file.is_dir():
            process_directory(file)
            continue

        if not file.suffix in {".js", ".svelte"}:
            continue

        text = file.read_text(encoding="utf8")
        if "m." not in text:
            continue

        lines = list(text.splitlines())

        print(f"\nProcessing {file}")
        for i, line in enumerate(lines):
            for call in paraglide_call_pattern.finditer(line):
                print(
                    f'Found {call.group("key")} in {file.relative_to(src.parent)}:{i+1} -> {line.replace(call.group(0), bold(call.group(0)))}'
                )
                message = messages.get(call.group("key"))
                if not message:
                    raise ValueError(f"Key {call.group('key')} not found in messages")
                lines[i] = line.replace(
                    call.group(0), f"'{message.replace("'", r"\'")}'"
                )

        file.write_text("\n".join(lines), encoding="utf8")


# ANSI bold for terminal
def bold(text: str) -> str:
    return f"\033[1m{text}\033[0m"


if __name__ == "__main__":
    process_directory(src)
