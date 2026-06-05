## This one is not vibe coded yet.
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

from .. import create_anki_notes_with_final_format as notes_with_format
from ..previous_notes import parse_translation

def file_to_translation(file):
    with open(file, 'r') as fd:
        lines = fd.readlines()
    lines = lines[6:] # Skip format lines
    translations = [parse_translation(line) for line in lines]
    return translations

parsed_files = [file_to_translation(BASE_DIR / file) for file in files]


def main():
    pass


if __name__ == '__main__':
    main()



