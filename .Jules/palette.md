## 2024-05-21 - Destructive Actions and Icon Buttons
**Learning:** Icon-only buttons for destructive actions like clearing task history frequently miss critical accessibility (ARIA labels) and user experience checks (confirmation dialogs) which can easily cause users to accidentally wipe their session data.
**Action:** Always verify that destructive buttons feature a confirmation check to prevent accidental loss, and ensure any icon-only button is accompanied by a descriptive `aria-label` for screen reader accessibility.
