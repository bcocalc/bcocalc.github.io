# Actual Pilot on Pipe (Dev Alpha262)

This optional Hot Tap adjustment assumes the recorded POP uses the same rod
scale as calculated On Rod POP and that Rod Start is correct. It does not
identify which original setup measurement caused a difference.

- Entering actual POP only previews original and adjusted outputs.
- Apply uses effective Lower In = actual POP - Rod Start.
- Original MD, LD, Rod Start, PTC and geometry remain unchanged.
- Hot Tap LI, TTD, POP, COP, Rod BCO and Rod MCO use the adjusted Lower In.
- MCO geometry is unchanged. COP remains calculated, not field-verified.
- Line Stop and Completion Plug calculations are not adjusted.
- Undo restores setup-based outputs and retains the recorded reading.
- Each application persists its reading and confirmation basis separately.
- A changed reading, setup or application identity requires another Apply.
- Missing geometry disables Apply. Missing or exceeded machine travel is
  explicitly warned about; the adjustment is not a safety certification.

The startup draft guard also prevents initial form defaults from replacing a
saved draft before restoration. Synthetic refresh events preserve a matching
confirmation; actual edits invalidate it.

Coverage: pure arithmetic and validation tests, Chromium/WebKit phone and
desktop preview, Apply, Undo, reload, legacy state, application isolation,
changed setup, and narrow light/dark layouts. Use the full release check before
publishing. Root/live files and deployment behavior are unchanged.
