# Changelog

All notable changes to this project will be documented in this file, on a monthly basis, with a consistent, simple format: month/year heading > type of change heading > list of changes.

## October 2025

### Improvements

- Fix width of buttons in protocol selection page
- Make debug dumps smaller in preview panel
- Make parallelism configurable (Closes #700) (#767)
- Put number of cards in grouped grid headings in monospace font
- Remove Manage protocols button on settings flyout
- Switch monospace font to Martian Mono
- Tweak text styles in /about
- Validate bundle analyzer modes on config load instead of assuming type

### Bug Fixes

- Fix fonts not loading
- Fix translations not working anymore
- Remove weird import in sidepanel's +layout.svelte

### Data Updates

- Regenerate example protocols

### Translation Updates

- Fix some weird msgids
- Refresh translation files
- Translate font credit line for Martian Mono in about page
- Translate some more
- Translate via Weblate (English)

## September 2025

### Improvements

- Compute alternatives and confidence scores of cascaded metadata values (#693)
- Ensure protocols don't have duplicate metadata IDs before saving to database
- Error out when upgrading a protocol but the newly downloaded one doesn't declare a version
- Fix ID validation
- Fix alignment of search icon and search bar on protocol tab
- Go to import tab when clicking on already-selected protocol on /
- Group observations/photos by whether they have bounding boxes (#688)
- Improve protocol management page
- Make confidence of bounding boxes aligned with dimensions
- Make default observation label customizable (#606)
- Remove grid lines background in cropper view
- Show first digit after comma on confidence percentage when value is less than 1%
- Use color on a gradient scale for confidence percentages

### Performance Improvements

- Improve general performance

### Accessibility Improvements

- Remove useless default aria-label for switch buttons
- Set aria-label on icon-only buttons

### Bug Fixes

- Don't preconnect to google fonts domain, fix font loading on preview builds
- Fix all monospace text is in italics
- Fix bug when cascading non-namespaced cascades
- Fix cards unselectable after ungrouping
- Fix checkboxe's checkmark would escape from scrolling
- Fix current protocol was lost on page reload
- Fix error toasts were not red anymore
- Fix file picker triggered by clicking on import tab
- Fix fonts not loading
- Fix href(...)
- Fix progress bar would stop before 100%
- Fix retry button in classify tab
- Fix small-confidence alternative metadata values would prevent classification from succeeding
- Prevent keyboard shortcuts from triggering when typing text into a field

### Data Updates

- Add beamup.origin to generated arthropods protocol
- Regenerate arthropods protocol (#689)

## August 2025

### Improvements

- Add keyboard shortcuts for navbar
- Add progress percentage in browser tab title
- Group keyboard shortcuts in help modal
- Remove "model loaded" toast

### Data Updates

- Regenerate arthropods protocol

## July 2025

### Improvements

- Add initial loading screen
- Add messages to make initial load screen more interesting
- Allow deleting images from cropper view (Closes #389)
- Improve title bar integration for native app
- Introduce relative crop paddings (#466)
- Make protocol import button's icon consistent with the upload more photos one
- Make whole native window draggable during initial load
- Prevent deleting active protocol
- Set minimum window size for native app
- Show OS info in /about for Electron builds
- Show feedback when protocol upgrade is in progress

### Performance Improvements

- Cache npm i and playwright browsers

### Bug Fixes

- Fix (and test) JSON schema generation
- Fix CSV export not containing valueLabels
- Fix boxes in cropper not updating until mouse is released
- Fix cannot go to classify tab when classification inference unavailable
- Fix dialog closing if click on background (but not backdrop)
- Fix errors when running classification on images without crops
- Fix export crop padding only extending in topleft direction (#465)
- Fix import tab when neural inference unavailable
- Fix light example protocole generation
- Fix logic for deciding to show OS architecture in /about
- Fix offset is not uint error when classifying image without cropbox
- Fix os info in /about on native app
- Fix os information for native app in /about
- Fix upgradeProtocol()
- Limit minimum width on sidepanel (Fixes #441)
- Only run languagesCompletions() within browser
- Refresh relevant tables after upgrading protocol

### Data Updates

- Add icons for Electron app
- Fix large classification model name
- Regenerate arthropods protocol

### Translation Updates

- Add ja locale
- Extract translatables (#477)
- Translate Confirmed popup on cropper view

### Legal Changes

- Add emojis at bottom of readmeeee <3

## June 2025

### Improvements

- Add a loading progress bar for models
- Allow adding padding to the crop box when exporting (Closes #135)

### Bug Fixes

- Fix protocol update not preserving existing species' keys
- Fix scripts/add-species-from-google-slides
- Protocol generation: sort options with numerical keys correctly

### Data Updates

- Regenerate arthropods protocol

## May 2025

### Improvements

- Add 'union' metadata merging strategy, for bounding boxes
- Add empty state for keyboard shortcuts help modal
- Auto-select boxes when creating/changing/deleting
- Don't include technical metadata in CSV export (Closes #228)
- Fix version check button in protocol selector way too wide
- Make compact ButtonUpdateProtocol more compact
- Only cachebust protocol images when they actually change
- Prevent confirmed crop indicators flicker when adding new box
- Refactor protocol generation process, include more GBIF data in it
- Surface metadata merging errors

### Bug Fixes

- Cachebust protocol update checks and upgrades
- Fix invalid URL for arthropods protocol species URLs from Google Slides
- Fix metadata combobox displayed under selected card (Fixes #234)
- Fix renovate config
- Fix version incrementation for example protocol generation
- Remove $ark.object table keys from generate json schemas
- Use max instead of average for enum metadata in example protocol

### Data Updates

- Add cache busters to image URLs of example protocol
- Download GBIF-sourced protocol images
- Example protocol: make clade parents generation object order-stable
- Fix cachebust for generated protocol, save image diffs
- Fix cachebuster logic for protocol generation
- Fix cachebuster logic for protocol generation (for good this time)
- Fix scripts/utils:photoChanged
- Forward-port confirmationCrop for default protocol definition
- Generate taxonomy.json using species list from protocol instead of classmapping
- Improve GBIF photos & descriptions choice a bit
- Make keys of new species from Google Slides stable
- Protocol generation: also use CC-BY-NC GBIF photos, credit even when no reference page
- Regenerate arthropods protocol
- Rename example protocol

## April 2025

### Improvements

- Add MetadataValue.manuallyModified, shown in export analysis json too
- Cram more cards per line, justify with space-around (Closes #191)
- Make --bg2 nicer in dark mode
- Make protocol cards a bit narrower
- Redesign protocol cards in /protocols
- Restore current protocol from local storage explicitly
- Set tab title
- Use --bg2 on CardObservation (Closes #140)
- Use app colors for links (Closes #197)
- Use app colors for tooltips
- Use monospace font for library versions
- make backdrop stand out more in dark mode (Closes #141)

### Bug Fixes

- Change builtin protocol ID to force redownload
- Fix RangeError: too many arguments when exporting to zip with large images
- Fix cannot import images without a EXIF date
- Fix change area not updating on resize anymore
- Refresh cropper image rect on image load event (Fixes #206, fixes #205)
- Remove debug saveAsFile feur.jpeg
- Storred infered EXIF metadata values when _not_ NaN (Fixes #194)
- Temporarily disable image duplication when multiple crop boxes exist

### Data Updates

- Add a .v2 version of the protocol
- Fix favicon
- Regenerate arthropods protocol

## March 2025

### Improvements

- Add about page (not linked anywhere for now lol)
- Add feedback for loading/error states when exporting results
- Add util functions to convert to AreaObservation's props object
- Add value labels for enum metadata in results analysis.json
- Add wikipedia links for options of species metadata
- Afficher l'aide des raccourcis dans la molette (closes #61)
- Allow deleting selection via Delete key
- Allow downloading a protocol definition template
- Allow importing multiple protocols at once
- Allow quick import+select of protocol from /
- Also export a .csv file
- Ask for the protocol to use before doing anything else (Closes #75)
- Choisir si on veut les images ou pas dans le téléchargement (closes #68)
- Disable merge button when less than 2 images are selected
- Don't show bare images' cards when they are part of an observation
- Ensure current tab is always valid for the current state
- Implement observation merging/splitting and bulk image deletion
- Improve UI in some places, add "technical metadata" toggle, make crop a technical metadata, fix shortcuts
- Improve default observation label, allow changing observation label, show selection count/filename/label in sidepanel
- Improve error messages on protocol imports
- Include confidence scores in CSV output
- Include valueLabel in images in analysis.json
- Intersperse observations and images, using their images' biggest id to sort
- Make navbar more centered
- Reanalyze metadata.species if metadata.crop changes (closes #71)
- Save uploaded images to database
- Select newly created observation after merge
- Selected newly created observation/images when grouping / ungrouping (closes #64)
- Show placeholder image when previewURL does not exist yet (closes #54)
- Turn all lone images into observations when arriving at classify page
- Use a map of id: metata in protocol exports instead of a list
- Use transaction for ctrl-u

### Performance Improvements

- Rendre le site installable et dispo offline (#92)

### Accessibility Improvements

- Ensure all ButtonIcon have a tooltip

### Bug Fixes

- Don't include learnMore: null in generated protocol
- Fix 0-key species displayed as (Unknown) in exported folder
- Fix asset URLs for model files in service worker
- Fix bounding box not showing on observation cards
- Fix csv export not showing enum labels for number-like enum keys
- Fix db state initialization
- Fix deletion not worky
- Fix deployment details modal not showing anything next to user picture if they have no displayname
- Fix disabled states for navigation tabs
- Fix extracted exif date is incredibly wrong (closes #49)
- Fix ghost items left in selection after lone images fix when exporting
- Fix logo size broked in Chrome
- Fix metadata display in sidepanel for observations
- Fix metadata merging logic
- Fix modal not centered, and could be closed by clicking on empty content inside
- Fix nav links
- Fix nav links not working on preview deployments
- Fix problems when opening new versions of the site since db schema changed
- Fix progress bar set total early when dropping new files (closes #50)
- Fix redirect to protocol choice page
- Fix split observation keybind (closes #62)
- Fix sw not actually using cache-models when matching a model request
- Fix various cute bugs
- Fix weird glitches when cards change
- Fix weird state desync on selection
- Fix weird things when merging observations
- Fix wrong details for related issue in DeploymentDetails
- Include images' metadata in analysis.json (closes #66)
- Loading spinner is way bigger than button icon when downloading results (closes #52)
- Maybe fix max/min strategy merging
- Only serve model files from cache when online
- Prevent error when exporting results if an observation has less metadata than another
- Shown crop box did not always match chosen thumbnail for stacked cards (closes #63)
- Turn lone images into 1-image observations before exporting

### Data Updates

- Add model declarations
- Define species metadata enum using classpath
- Host model files on github instead
- No lfs, come back plz </3
- Regenerate arthropods protocol
- Use CNRS drive URLs for hosting model files

## February 2025

### Improvements

- Add feur
- Add toasts.success
- Create root layout
- Import tensorflow PoC from @tianoc

### Bug Fixes

- Fix \_components not updating URL properly after setting props
- Fix overflow of toasts on long messages

### Data Updates

- Add --bg-primary-translucent
- Import fonts
