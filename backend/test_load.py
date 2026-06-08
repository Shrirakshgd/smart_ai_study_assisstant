import os
from services import load_note_context

try:
    load_note_context("This is a test note content.")
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
