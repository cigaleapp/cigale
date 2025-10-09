#!/usr/bin/env uv run --script
# /// script
# dependencies = ["rdata", "rich"]
# ///


from rdata.parser import parse_file
from rich import print

print(parse_file("metadata_correct.RData"))
