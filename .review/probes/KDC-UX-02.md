<!-- KDC-UX-02 ISO Lernförderlichkeit / Nielsen 10: the ConfirmDialog behaviour change (alertdialog) needs Storybook stories -->
- URL: `$BASE/index.json` (Storybook 0.6.0, port 6106 in the review run)
- Viewport and theme: 1280, light
- Selector: entries `compositions-dialogs-confirm-dialog--alert-dialog`, `--plain-dialog`, `--confirm-input`, `--alert-dialog-in-sheet`
- Measured (re-check 15.11.2026, head 0f4f1da): all present; alert-dialog role alertdialog, focus on Cancel; confirm-input focus on the input; plain-dialog role dialog
- Expected: the four ids exist (`curl -s $BASE/index.json | grep -c confirm-dialog--` at least 4)
