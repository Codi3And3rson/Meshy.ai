
## 2024-05-25 - Form Accessibility Defaults

**Learning:** When using `<form>` tags, inputs inside the form trigger an automatic submit on "Enter". However, without explicit labels bound via `id` and `htmlFor`, assistive technology cannot identify the purpose of the fields. File inputs must also be visually hidden (using a `.sr-only` class) rather than `display: none` or `visibility: hidden` so they remain focusable and usable by keyboards.
**Action:** Always wrap logical inputs in a `<form>`, bind labels using `htmlFor`, and use screen-reader-only utility classes for hidden inputs that must remain accessible. Add explicit `aria-busy` to submit buttons and `aria-live` to dynamically rendered error or state containers.
