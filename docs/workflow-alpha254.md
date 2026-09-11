# Application-first workflow, alpha254

Dev only. No live promotion or calculation changes.

Alpha255 follow-up: GitHub's Linux WebKit check caught a 320-pixel font-width
difference. Give Measurements a wider grid column and inherit the app font.
The overflow assertion remains unchanged.

- Workflow starts with the existing job's application cards.
- Open a card to work on its saved measurements, with its name visible.
- Setup, Measurements and Results navigation; Next follows the selected sheet.
- Back to Applications returns to the list; Add Application offers the existing
  Hot Tap, Line Stop and Completion creation paths and starts at pipe setup.
- Name, notes, duplicate/delete controls and the calculation checklist are
  collapsed. Existing related sheets remain available under an explicit disclosure.
- Shared job fields, including the existing machine field, retain their existing
  storage semantics. No record migration or automatic measurement correction.

Tests cover three separate Line Stops plus a Completion Plug and the initial
Hot Tap, preserving distinct measurements when opened through cards by touch.
The complete release check still covers the protected Library and sync behavior.

Actual field POP/COP observations and dependent-result adjustments are a separate
follow-up. Original setup inputs must remain available, with adjustment scope
derived from the existing equations rather than guessed.
