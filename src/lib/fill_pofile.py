from pathlib import Path
import json
import re

src = Path(__file__).parent.parent

english = json.loads(Path(src.parent / "messages/en.json").read_text(encoding="utf8"))
french = json.loads(Path(src.parent / "messages/fr.json").read_text(encoding="utf8"))

del english["$schema"]
del french["$schema"]


def named_to_positional(text_with_placeholders: str) -> str:
    pattern = re.compile(r"\{(?P<name>[a-z0-9_]+)\}")
    names = []

    def replacer(match: re.Match) -> str:
        name = match.group("name")
        if name not in names:
            names.append(name)
        return "{" + str(names.index(name)) + "}"

    result = pattern.sub(replacer, text_with_placeholders)
    if result != text_with_placeholders:
        print(f"Converted '{text_with_placeholders}' to '{result}'")
    return result


french_to_english = {
    named_to_positional(french[key]): named_to_positional(english[key])
    for key in french.keys()
    if key in english
}

pofile = Path(src / "locales/en.po")


def red(text: str) -> str:
    return f"\033[91m{text}\033[0m"


def try_surrounding_with_tags(in_french: str) -> str | None:
    prefixed = french_to_english.get(in_french.removeprefix("<0/> "))
    if prefixed:
        return f"<0/> {prefixed}"

    suffixed = french_to_english.get(in_french.removesuffix(" <0/>"))
    if suffixed:
        return f"{suffixed} <0/>"

    inside = french_to_english.get(in_french.removeprefix("<0>").removesuffix("</0>"))
    if inside:
        return f"<0>{inside}</0>"

    wrapped = french_to_english.get(
        in_french.removeprefix("<0/> ").removesuffix(" <1/>")
    )
    if wrapped:
        return f"<0/> {wrapped} <1/>"

    return None


lines = list(pofile.read_text(encoding="utf8").splitlines())
for i, line in enumerate(lines):
    match = re.match(r'msgid "(?P<key>.+)"', line)
    if not match:
        continue

    key = match.group("key")
    message = french_to_english.get(key) or try_surrounding_with_tags(key)
    if not message:
        print(red(f"Not found: {key}"))
        continue

    if lines[i + 1] != 'msgstr ""':
        continue

    print(f"Found {key} in {pofile.relative_to(src.parent)}:{i+1} -> {line}")
    pofile.write_text(
        pofile.read_text(encoding="utf8").replace(
            f'msgid "{key}"\nmsgstr ""',
            f'msgid "{key}"\nmsgstr "{message.replace('"', r'\"')}"',
        ),
        encoding="utf8",
    )
