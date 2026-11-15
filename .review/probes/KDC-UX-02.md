<!-- KDC-UX-02 ISO Lernförderlichkeit / Nielsen 10: the ConfirmDialog behaviour change (alertdialog) has no Storybook story -->
- URL: `$BASE/index.json` (Storybook 0.6.0, port 6106 in the review run)
- Viewport and theme: any
- Selector: entries whose id contains `confirm-dialog` or `confirmdialog`
- Measured (15.11.2026): 0 entries; ConfirmDialog only appears as a sentence in `primitives-dropdownmenu--opens-overlay`
- Expected: at least `primitives-confirmdialog--default` (alertdialog, focus on Cancel, outside click keeps it open), `--with-confirm-value` (focus on the input) and `--plain-dialog` (`role="dialog"`)
- Check: `curl -s $BASE/index.json | grep -ci confirm` must be greater than 0
