// Built-in texts of the component library. English is the default, German ships as labelsDe.
// Parameterised texts are functions so every language can order the words itself.

export type DesignSystemLocale = 'en' | 'de';

export interface Labels {
  // Generic
  add: string;
  addNew: string;
  and: string;
  or: string;
  apply: string;
  cancel: string;
  clear: string;
  close: string;
  code: string;
  content: string;
  copied: string;
  copyCode: string;
  dismiss: string;
  // Accessible name of the toast region. `{hotkey}` is replaced by the shortcut that jumps into it (F8).
  toastRegion: string;
  // Spoken before the text of each toast, so a screen reader announces what it is.
  toastNotification: string;
  find: string;
  group: string;
  help: string;
  loading: string;
  loadingItem: (label: string) => string;
  loadingMore: string;
  loadMore: string;
  menu: string;
  navigation: string;
  next: string;
  notFound: string;
  online: string;
  overflowMore: string;
  phone: string;
  pleaseWait: string;
  previous: string;
  required: string;
  reset: string;
  search: string;
  searchEllipsis: string;
  searchIn: (label: string) => string;
  selectedSuffix: string;
  invalidSuffix: string;
  send: string;
  showPassword: string;
  hidePassword: string;
  sending: string;
  settings: string;
  subscribe: string;
  total: string;
  tryAgain: string;
  tryAgainInAMoment: string;
  unread: string;
  unreadPrefix: string;
  verified: string;
  couldNotLoad: string;
  nothingHereYet: string;
  remove: (label?: string) => string;
  removeFilter: (label: string) => string;
  retryItem: (name: string) => string;
  itemCount: (count: number) => string;
  noItemsYet: (label: string) => string;
  itemNotLoaded: (label: string) => string;
  // Landmarks and navigation
  breadcrumb: string;
  main: string;
  primary: string;
  footer: string;
  categories: string;
  toggleMenu: string;
  closeMenu: string;
  mobileNav: (label: string) => string;
  moreLevels: string;
  backFrom: string;
  escClosesSettings: string;
  statusActive: string;
  statusInactive: string;
  locked: string;
  sidebarMainMenu: string;
  sidebarExpand: string;
  sidebarCollapse: string;
  sidebarSearch: string;
  quickActions: string;
  workspaces: string;
  createWorkspace: string;
  // Pagination and carousel
  pagination: string;
  pages: string;
  page: (page: number) => string;
  pageOf: (page: number, pageCount: number) => string;
  previousPage: string;
  nextPage: string;
  rowsPerPage: string;
  perPage: (count: number) => string;
  range: (first: number, last: number, total?: number) => string;
  showing: (count: number, total: number) => string;
  goToPage: (page: number, count: number) => string;
  goToSlide: (slide: number, count: number) => string;
  previousSlide: string;
  nextSlide: string;
  // Data states
  noDataAvailable: string;
  noDataYet: string;
  dataNotLoaded: string;
  loadingTableData: string;
  tableErrorTitle: string;
  tableErrorDescription: string;
  sheetLoadError: string;
  serviceNotResponding: string;
  weekRowHeader: string;
  weekEmptyTitle: string;
  weekErrorTitle: string;
  weekLoading: string;
  monthEmptyTitle: string;
  monthErrorTitle: string;
  monthLoading: string;
  weekdaysShort: string[];
  heatmapRowHeader: string;
  heatmapErrorTitle: string;
  heatmapLoading: string;
  chartEmptyTitle: string;
  chartErrorTitle: string;
  chartErrorDescription: string;
  chartLoading: string;
  chartCategory: string;
  chartSlice: string;
  chartValue: string;
  chartShare: string;
  chartAxis: string;
  chartBin: string;
  chartCount: string;
  chartItem: string;
  legend: string;
  valueOfMax: (value: string, max: string) => string;
  cvEmptyTitle: string;
  cvEmptyDescription: string;
  cvErrorTitle: string;
  cvErrorDescription: string;
  cvLoading: string;
  skillsEmptyTitle: string;
  skillsErrorTitle: string;
  skillsLoading: string;
  timelineEmptyTitle: string;
  timelineErrorTitle: string;
  timelineErrorDescription: string;
  timelineLoading: string;
  notifications: string;
  notificationsEmptyTitle: string;
  notificationsEmptyDescription: string;
  notificationsErrorTitle: string;
  notificationsErrorDescription: string;
  notificationsLoading: string;
  markAllRead: string;
  // Kanban
  kanbanEmptyColumn: string;
  kanbanErrorTitle: string;
  kanbanErrorDescription: string;
  kanbanLoading: string;
  kanbanMoveCancelled: string;
  kanbanMoveReverted: (title: string) => string;
  kanbanDroppedInPlace: string;
  kanbanPosition: (column: string, position: number) => string;
  kanbanPickedUp: (title: string | undefined, position: string) => string;
  kanbanDropped: (title: string | undefined, position: string) => string;
  kanbanMoveTo: string;
  kanbanCardActions: (title: string) => string;
  kanbanCurrentColumn: (column: string) => string;
  // Scores
  score: string;
  scoreBreakdown: string;
  scoreBreakdownLoading: string;
  scoreCounts: string;
  scoreFormulaOpen: string;
  scoreLocked: (label: string) => string;
  scorePercent: (label: string, percent: number) => string;
  scoreServiceNotResponding: string;
  scoreSuffixAnd: string;
  scoreSuffixOr: string;
  criteriaEmptyTitle: string;
  criteriaEmptyDescription: string;
  matchErrorTitle: string;
  formulaEmpty: string;
  formulaError: string;
  formulaLoading: string;
  // Forms and inputs
  activeFilters: string;
  appliedFilters: string;
  addFilter: string;
  addItems: string;
  selectTime: string;
  addTag: string;
  tagsAdded: (tags: string) => string;
  tagRemoved: (tag: string) => string;
  bulkActions: string;
  deselectAll: string;
  selectedCount: (count: number) => string;
  moreActions: string;
  noFiltersApplied: string;
  filtersApplied: (count: number) => string;
  filters: string;
  matchMode: string;
  showMore: (count: number) => string;
  showLess: string;
  digit: (index: number, length: number) => string;
  minimum: string;
  maximum: string;
  presets: string;
  selectDate: string;
  signature: string;
  signHere: string;
  eventColumn: string;
  checkAll: string;
  uncheckAll: string;
  unsavedChanges: string;
  autosaveHint: string;
  enterNew: (label?: string) => string;
  pressEnterToAdd: string;
  selectCountry: string;
  searchCountry: string;
  noCountryFound: string;
  // Accessible names of the select family and the stepper
  openOptions: string;
  selectOptions: string;
  stepName: (index: number, label?: string) => string;
  stepCurrent: string;
  autosaveStates: Record<'saved' | 'saving' | 'dirty' | 'error' | 'offline', string>;
  // Upload
  fileUploadTitle: string;
  fileUploadDescription: string;
  fileUploadLoading: string;
  uploadFailed: string;
  uploadComplete: string;
  uploadedPercent: (percent: number) => string;
  uploading: (name: string) => string;
  // Editor and code
  richTextActions: Record<
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'code'
    | 'heading1'
    | 'heading2'
    | 'quote'
    | 'link'
    | 'image'
    | 'bulletList'
    | 'orderedList'
    | 'undo'
    | 'redo'
    | 'alignLeft'
    | 'alignCenter'
    | 'alignRight'
    | 'alignJustify'
    | 'textColor'
    | 'highlight',
    string
  >;
  textFormatting: string;
  editorMode: string;
  write: string;
  preview: string;
  previewRegion: string;
  nothingToPreview: string;
  // Misc
  announcement: string;
  dismissBanner: string;
  typing: string;
  reactions: string;
  skills: string;
  skillsTitle: string;
  storage: string;
  storageUsed: (used: number, total: number, unit: string) => string;
  storagePercentUsed: (label: string, percent: number) => string;
  rating: string;
  ratingOf: (label: string, filled: number, max: number) => string;
  rowActions: string;
  selectAllRows: string;
  selectRow: string;
  dataGrid: string;
  trendUp: string;
  trendDown: string;
  timer: string;
  timerState: (label: string, running: boolean, time: string) => string;
  socialSignIn: string;
  signInWith: (provider: string) => string;
  // Sections
  learnMore: string;
  aboutItem: (title: string) => string;
  readArticle: string;
  fromOutlet: (outlet: string) => string;
  billing: (label: string) => string;
  emailAddress: string;
  enterYourEmail: string;
  noPostsYet: string;
  noOpenPositions: string;
  noTeamMembersYet: string;
  noQuestionsYet: string;
  // CV
  education: string;
  experience: string;
  deliverables: string;
  durationYears: (count: number) => string;
  durationMonths: (count: number) => string;
  durationAnd: string;
  durationLessThanMonth: string;
  // Confirm dialog and guest header
  confirm: string;
  typeToConfirm: (value: string) => string;
  language: string;
  switchTheme: string;
  // Calendar grid add affordance
  addEntry: string;
  messageActions: string;
  unreadCount: (count: number) => string;
  muted: string;
  showSecret: string;
  hideSecret: string;
  copyValue: string;
  colorOption: (index: number) => string;
  pickColor: string;
  hexColor: string;
  stepCompleted: string;
  stepFailed: string;
  weekTotal: string;
  holiday: string;
  fileNotUploaded: string;
  kanbanMovedTo: (column: string) => string;
  todaySuffix: string;
  avatarUpload: string;
  // Site and layout pieces (table of contents, cookie banner, countdown, chat window, versions, file icon, blind mode)
  tableOfContents: string;
  cookieConsentRegion: string;
  acceptAllCookies: string;
  declineNonEssentialCookies: string;
  cookieSettings: string;
  cookieClose: string;
  cookieSaveSelection: string;
  cookieBack: string;
  cookieAlwaysActive: string;
  cookieSettingsTitle: string;
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  countdownSeconds: string;
  countdownEnded: string;
  countdownFinished: string;
  chatMinimize: string;
  chatRestore: string;
  versionsTitle: string;
  currentVersion: string;
  versionLabel: (version: string | number) => string;
  versionBy: (name: string) => string;
  restoreVersion: (version: string | number) => string;
  downloadVersion: (version: string | number) => string;
  versionRestoring: string;
  noVersionNote: string;
  noVersionsYet: string;
  blindMode: string;
  blindModeDescription: string;
  blindModeOn: string;
  blindModeOff: string;
  blindModeAnnounceOn: string;
  blindModeAnnounceOff: string;
  fileKind: (kind: string) => string;
  // Compact countdown units
  countdownDaysShort: string;
  countdownHoursShort: string;
  countdownMinutesShort: string;
  countdownSecondsShort: string;
  // Inline edit cell
  editCell: (label: string, value: string) => string;
  addNote: (label: string) => string;
  editNote: (label: string) => string;
  noteField: (label: string) => string;
  // Tag input suggestions
  tagSuggestions: string;
  tagSuggestionsCount: (count: number) => string;
  requiredByJob: string;
  // Rating input: name of one star option, e.g. `2 of 5`
  ratingOption: (value: number, max: number) => string;
}

// Per-instance override: a plain string, or for parameterised texts a string or the function form.
export type LabelProp<Args extends unknown[] = []> = string | ((...args: Args) => string);

export type LabelOverrides = {
  [K in keyof Labels]?: Labels[K] extends (...args: infer A) => string ? LabelProp<A> : Labels[K];
};

// Precedence: instance prop, then provider labels, then the English default.
export const applyLabelOverrides = (base: Labels, overrides?: LabelOverrides): Labels => {
  if (!overrides) return base;
  const next: Record<string, unknown> = { ...base };
  (Object.keys(overrides) as (keyof Labels)[]).forEach((key) => {
    const value = overrides[key];
    if (value === undefined) return;
    next[key] = typeof base[key] === 'function' && typeof value === 'string' ? () => value : value;
  });
  return next as unknown as Labels;
};
