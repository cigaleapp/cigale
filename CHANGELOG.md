# Changelog

All notable changes to this project will be documented in this file, on a monthly basis, with a consistent, simple format: month/year heading > type of change heading > list of changes.

## January 2026

### Improvements

- Add ETA as tooltip on navbar logo when processing is ongoing (Closes #51) (#1027)
- Add ability to catch coercion errors in switchOnMetadataType()
- Add protocol auto-updating (Closes #954) (#1088)
- Allow changing tolerance settings for grouping in gallery tabs
- Allow grouping observation with hundreds number precision
- Fix opacity of disabled ButtonSecondary
- Fix vertical line in zip contents preview tree not extending when scrolling
- Handle empty state for tab settings group/sort metadata submenu
- Handle invalid grouping/sorting settings gracefully
- Implement average merge method for enum metadata
- Improve keyboard shortcuts hints
- Make Chrome scrollbars thinner
- Make gallery groups collapsible
- Make model switching less buggy (#1110)
- Rajouter validation pour les forms de creation d'issue (Closes #1049)
- Safeguard against crashing if somehow a plural i18n message doesn't have enough candidates
- Safeguard against storing >1-confidence metadata values
- Show loading spinner when opening a session
- Show uncompressed zip size estimate
- Sort metadata in tab's sort/group dropdowns
- Take crop padding into account when estimating .zip sizes (#1052)
- Turn results modal into a full page, complete with zip files preview and size estimations
- Use enter key glyph to display Enter in keybind hints
- Use skeleton UI instead of spinners where relevant (Closes #1047)
- Use submenus to shorten tab settings dropdown

### Bug Fixes

- Fix click-to-import triggering when clicking on buttons in gallery groups' headers
- Fix crashes related to metadata merging code changes
- Fix current tab indicators not showing on non-root base path deployments
- Fix duplicates in sort/group metadata submenus
- Fix inference models not being cached (Closes #1077)
- Fix reactivity over value prop of MetadataInput
- Fix sessionId index name for file tables
- Include protocol ID in caching key when using string-form HTTPRequest for inference model
- Parse serialized date metadata values with fractional seconds
- Prevent zip preview from being empty if we went from import tab to results tab directly
- Reset collapsed groups state when group settings change
- Restore group and sort settings when importing an exported session

### Data Updates

- Add missing images for builtin protocol
- Commit new images when regenerating protocols
- Correctly get all relevant images from Jessica Joachim for built-in protocol
- Fix builtin protocol's images from Jessica Joachim
- Regenerate builtin protocol
- Regenerate example protocols
- Set groupable and sortable on relevant metadata for built-in protocol

### Translation Updates

- Refresh translation files
- Translate via Weblate (English)

## October 2025

### Improvements

- Add beta disclaimers
- Add default crop padding setting
- Add field label for protocol description
- Allow deleting option from option details page
- Change icon pack to Remix Icon (#776)
- Clarify that pattern repeats by adding labels to faded nodes in diagram
- Color differences-with-remote-protocol count according to amount of changes
- Document variables in export configuration
- Don't update DB if error occured in updater
- Enlarge panels when sidebar is collapsed
- Finish authors editing
- Finish crop settings
- Finish protocol diffing
- Fix alignment on RowProtocol
- Fix font family in keyboard hints
- Fix math font
- Fix width of buttons in protocol selection page
- Implement diffing of protocol with its remote, upstream version
- Improve appearance of changes with remote protocol
- Improve other model setting inputs
- Improve style of arrays in protocol changes-with-remote list
- Make debug dumps smaller in preview panel
- Make parallelism configurable (Closes #700) (#767)
- Make version input monospace
- Migrate from hash-router-based URLs
- Prevent image numbers in cropper navigation from becoming small
- Put number of cards in grouped grid headings in monospace font
- Put search bar above new option field in options edition page
- Remove Manage protocols button on settings flyout
- Remove checkmark icon from continue button in cropper
- Show loading spinner on card while loading cropper view
- Show options count on metadata navbar
- Switch monospace font to Martian Mono
- Tweak text styles in /about
- Validate bundle analyzer modes on config load instead of assuming type

### Bug Fixes

- Fix computation progress for protocol diffing not showing up
- Fix displaying of added metadata in protocol diffing
- Fix fonts not loading
- Fix option description updates not store in db
- Fix some bugs
- Fix translations not working anymore
- Remove weird import in sidepanel's +layout.svelte

### Data Updates

- Regenerate example protocols

### Translation Updates

- Fix some weird msgids
- Refresh translation files
- Reset translation file changes
- Translate font credit line for Martian Mono in about page
- Translate some more
- Translate via Weblate (English)

## December 2025

### Improvements

- Add deletion confirmation modal for session deletes
- Add issue submit modal
- Add keyboard shortcuts for issue submitting
- Add radio buttons presentation for smaller enum metadata
- Add undo/redo buttons to UI
- Allow editing metadata option synonyms in protocol editor
- Allow multiple images on a single metadata option
- Allow specifying metadata option ordering for enums
- Allow unrolling stacked cards (e.g. observations with >1 images)
- Allow using a date metadata to set file mtime in zip export
- Cancel all tasks when switching sessions
- Clear undo stack when switching sessions
- Display enums with compact representation when they have ≤10 items
- Fix card overlays going over grouping header
- Handle viewing sessions with unavailable protocols
- Hide navbar in cropper (#921)
- Implement MetadataEnumVariant.{color,icon} (#956)
- Implement session protocol change
- Improve cascades display in combobox
- Improve disabled state (and transitions from/to disable state) for Button{Secondary,Primary}
- Improve lightmode error background color a bit
- Improve remote protocol import flow
- Indicate scrollablility on MetadataCombobox description part (Closes #995)
- Introduce session-level metadata in protocol definition
- Left-align cards in AreaObservation (Closes #950)
- Make analysis.json's zip filepath non-customizable
- Make inference model selections per-session
- Make session description editable
- Mention sessions using the protocol when deleting it
- Remove unsaved work indicator in protocols list
- Round corners of unrolled group background
- Show app version in about page
- Show icon & color of cascaded values in combobox
- Show notification when app update is found or was installed
- Show synonyms when metadata search matched by synonym
- Use title attribute when putting a tooltip on a element inside of a <dialog>

### Accessibility Improvements

- Allow ButtonInk to be a <a> tag, expose this for toast actions

### Bug Fixes

- (probably) fix splitting observations
- Don't apply undos if operation was for a different ImageFile
- Don't push operation to undo stack if its data is invalid
- Don't put protocol id as default description for new sessions
- Fix EXIF extraction not updating UI with metadata values
- Fix OK button showing up on all toasts (Fixes #992)
- Fix cannot import results zip into session if export has session metadata values set
- Fix deleteSession
- Fix image deletion not working in import tab
- Fix metadata change DB writes not being reactive
- Fix observation merging making observations disappear
- Fix observation merging sometimes not working on Chrome
- Fix observation splitting not working
- Fix undo stack depth limit enforcement
- Make metadata option description actually optional
- Make metadata value clear button work on import tab and on session metadata
- Make sure preview image of >1-images-observation is the first image of the selection used to group it up
- Put tooltips above bits-ui flyouts (e.g. comboboxes)
- Retrieve session description for zip export when importing it, fallback name when saved one is empty
- Set manuallyModified when changing session metadata values
- Show description of options on MetadataInput when presenting as radio buttons
- Sort metadata options by index instead of (non-specified) ordering property
- Try fixing full-page reload on each goto() navigation in prod only

### Data Updates

- Add ETA and exponential retry wait time for IUCN augmentation script
- Add icon-padded.png logo
- Difficulté d'ID et statut IUCN dans le proto. d'example (Closes #369)
- Fix extra ff in color hex of conservation_status metadata option
- Forward-port session metadata in example protocol
- Get IUCN conservation status from the IUCN Red List API
- Handle more IUCN codes
- Prevent JJ script from deleting other cascades when augmenting
- Regenerate example protocols
- Try fixing ordering of conservation_status and identification_difficulty
- Use JJ site for genus descriptions too (#920)
- Use images instead of image when generating example protocol

### Translation Updates

- Refresh translation files
- Translate via Weblate (English)
- Update translations

## November 2025

### Improvements

- Add \_obsN in exported images' file names
- Add notifications (#775)
- Add {{numberInObservation}} in export filepath templates
- Add {{observation.number}} and {{numberInObservation}} to export path templates (#904)
- Add {{observation.number}} in protocol export path templates
- Adjust colors
- Disable auto-classification of uncropped images (#888)
- Introduce metadata option synonyms
- Select Arthropods model by default on built-in protocol (#906)

### Bug Fixes

- Corner handles of crop box were transparent when hovered or held
- Fix 404 when going to /
- Fix full-page reload for goto()s
- Fix learn more URL in default protocol
- Fix models not changing or glitching when switching models while on the tab (#905)
- Fix mystery null values in synonyms for built-in protocol
- Fix whole-page reload on every <a> click

### Data Updates

- Regenerate example protocols
- Rewrite Jessica Joachim script (#824)
- Search with synonyms in Jessica Joachim site when generating built-in protocol
- Set synonyms on species for built-in protocol

### Translation Updates

- Refresh translation files

## September 2025

### Improvements

- Add prepare for offline use feature
- Add retry button on cards in classify & crop tabs
- Add selection and sidepanel to crop tab
- Allow reverting crops even when no initial boxes exist
- Allow selecting loading cards, cancel tasks when hitting Delete on selection
- Compute alternatives and confidence scores of cascaded metadata values (#693)
- Don't apply bounding boxes to cards on import tab
- Ensure protocols don't have duplicate metadata IDs before saving to database
- Error on too-large images in the import tab
- Error out when upgrading a protocol but the newly downloaded one doesn't declare a version
- Fix ID validation
- Fix alignment of search icon and search bar on protocol tab
- Go to import tab when clicking on already-selected protocol on /
- Group observations/photos by whether they have bounding boxes (#688)
- Improve no images state when on crop or classify tabs
- Improve option/metadata not found states
- Improve protocol management page
- Make classmapping download represent only 10% of progress bar for model loading
- Make confidence of bounding boxes aligned with dimensions
- Make default observation label customizable (#606)
- Make grid size customizable
- Move detection analysis to crop tab
- Prevent weird jittering of progress bar when using multiple sw&rpc nodes
- Prompt for more files to import on empty gallery clicks on import tab
- Put model selection in navbar tabs
- Remove grid lines background in cropper view
- Show first digit after comma on confidence percentage when value is less than 1%
- Show parallelism numbers in /about
- Stay on same tab inside metadata panel when switching metadatas
- Style the range input
- Use color on a gradient scale for confidence percentages

### Performance Improvements

- Improve general performance
- Parallelize job queue

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
- Fix loading state never disappearing on crop tab cards
- Fix progress bar would stop before 100%
- Fix retry button in classify tab
- Fix retry button on crop tab cards
- Fix small-confidence alternative metadata values would prevent classification from succeeding
- Prevent caching attempts on non-HTTP schemes
- Prevent keyboard shortcuts from triggering when typing text into a field

### Data Updates

- Add beamup.origin to generated arthropods protocol
- Regenerate arthropods protocol (#689)

### Translation Updates

- Localize metadataPrettyValue
- Translate date- and number-related formatting

## August 2025

### Improvements

- Add a separate pool for toasts originating in modals
- Add keyboard shortcuts for navbar
- Add progress percentage in browser tab title
- Display proper .cr2 import error toast on linux
- Don't abort results zip generation if EXIF write fails
- Group keyboard shortcuts in help modal
- Handle too-large image errors gracefully
- Improve appearance of small delete buttons
- Model preselect URL params: Use 0 instead of -1, and 1-based indices
- Prevent going to classification tab while detection analysis is ongoing
- Raise memory limit for JPEG image decoding
- Remove "model loaded" toast

### Accessibility Improvements

- Improve accessiblity of RadioButtons and protocol selection UI

### Bug Fixes

- Correctly await transaction end in openTransaction
- Fix cannot set classification & crop models at the same time via URL parameters
- Fix results import
- Fix some jankyness in error displaying when deleting ImageFiles
- Prevent empty observations from being created when deleting an image in the import tab
- Surface errors in toast when ImageFile could not be created

### Data Updates

- Regenerate arthropods protocol

### Translation Updates

- Translate inference unavailable tooltips

## July 2025

### Improvements

- Add initial loading screen
- Add links to README in other languages
- Add messages to make initial load screen more interesting
- Allow deleting images from cropper view (Closes #389)
- Disable crop padding UI when export doesnt include cropped images
- Don't close import URL-preselected protocol modal until import finishes
- Don't throw inside a catch handler
- Hide "no inference" indicator icons in navbar when no protocol is selected
- Hide native titlebar
- Improve default native window dimensions
- Improve title bar integration for native app
- Introduce relative crop paddings (#466)
- Make protocol import button's icon consistent with the upload more photos one
- Make whole native window draggable during initial load
- Persist selected protocol models
- Prevent deleting active protocol
- Run bounding box inference on service worker
- Set minimum window size for native app
- Set native progress bar for electron app
- Show Electron versions in /about
- Show OS info in /about for Electron builds
- Show cascades on metadata enum combobox (Closes #373)
- Show feedback when protocol upgrade is in progress
- Show translation completion on languages switch

### Performance Improvements

- Cache npm i and playwright browsers

### Bug Fixes

- Cancel box creation when dragging outside crop surface
- Correctly unserialize value when updating state from storeMetadataValue
- Don't opt out tfjs from vite dep optimization
- Dont hardcode database name & rev no. in neural worker
- Fix (and test) JSON schema generation
- Fix CSV export not containing valueLabels
- Fix boxes in cropper not updating until mouse is released
- Fix cache handling for models
- Fix cannot go to classify tab when classification inference unavailable
- Fix cropping for imload
- Fix devtools not opening on electron builds
- Fix dialog closing if click on background (but not backdrop)
- Fix errors when running classification on images without crops
- Fix export crop padding only extending in topleft direction (#465)
- Fix import tab when neural inference unavailable
- Fix light example protocole generation
- Fix logic for deciding to show OS architecture in /about
- Fix numeric and string metadata type updates
- Fix offset is not uint error when classifying image without cropbox
- Fix os info in /about on native app
- Fix os information for native app in /about
- Fix package versions in /about not updating
- Fix sw not activating on production
- Fix upgradeProtocol()
- Fix white page in Electron prod build
- Go to next image after deleting in cropper view
- Limit minimum width on sidepanel (Fixes #441)
- Only run languagesCompletions() within browser
- Open database before writing protocol in importProtocol
- Prevent ghost boxes in cropper view when navigating quickly
- Protocol tab not highlighted after importing model from preselection URL
- Refresh relevant tables after upgrading protocol
- Support ImageFile subject IDs in storeMetadataValue
- Update merged metadata values passed to sidepanel on metadata changes
- Use a dedicated Worker instead of the SW for off-thread computation

### Data Updates

- Add icons for Electron app
- Fix large classification model name
- Fix wait-for-analysis logic
- Regenerate arthropods protocol
- Use real protocol in screenshots

### Translation Updates

- Add ja locale
- Extract "Confiance: x%" in ConfidencePercentage
- Extract translatables (#477)
- Translate Confirmed popup on cropper view
- Translate initial loading text
- Translate new strings to English
- Translate readme

### Legal Changes

- Add emojis at bottom of readmeeee <3
- License under MIT

## June 2025

### Improvements

- Add a loading progress bar for models
- Add learn more URLs to generated protocol (GBIF)
- Add visual indicator when protocol does not define detection/classification inference
- Allow adding padding to the crop box when exporting (Closes #135)
- Allow disabling inference on a protocol that has it defined
- Allow multiple models for neural inference (Closes #334)
- Allow preselecting a remote protocol
- Allow preselecting model in URL (closes #337)
- Load options in metadata inputs panel
- Prevent loading model multiple times
- Put import protocol button in loading state while protocol is importing
- Reintroduce classmapping in protocol spec for neural inference of enum metadata
- Replace taxonomic metadata with just cascades in metadata enum variants
- Sort options by label after loading on sidepanel
- Support full HTTPRequest instead of just URLs for protocol models

### Bug Fixes

- Fix 17k model URL in example protocol
- Fix ?protocol not cleared after selecting another in /
- Fix EXIF data processing
- Fix alternatives not showing labels in metadata panel
- Fix cannot delete observations
- Fix loading options in sidepanel when multiple protocols are loaded
- Fix protocol update not preserving existing species' keys
- Fix scripts/add-species-from-google-slides
- Handle inferenceless protocols
- Limit add-species-from-jessica-joachim to lightweight model's classes
- Protocol generation: sort options with numerical keys correctly

### Data Updates

- Also include lightweight-protocol-only species
- Regenerate arthropods protocol
- Sort options by label in example protocol

## May 2025

### Improvements

- Rework "crop confirmation" representation, add global revert button
- Add "import more" button in sidepanel
- Add 'union' metadata merging strategy, for bounding boxes
- Add a background blur for cardobservation with cropped images
- Add empty state for keyboard shortcuts help modal
- Add hand tool
- Add keybinds for zoom =0, ++, --
- Add keyboard shortcut to highlight prev/next box
- Add loading spinner for cropper view image
- Apply crop to sidepanel images
- Auto-select boxes when creating/changing/deleting
- Don't include technical metadata in CSV export (Closes #228)
- Finish script!
- Fix next-unconfirmed cycling
- Fix version check button in protocol selector way too wide
- Implement results zip import
- Improve keyboard hints a bit
- Introduce protocol versioning
- Make compact ButtonUpdateProtocol more compact
- Move global revert / confirm buttons to top
- Only cachebust protocol images when they actually change
- Only show "how to create a box" tip when it's relevant
- Preserve zoom states for every image
- Prevent confirmed crop indicators flicker when adding new box
- Properly recover lost whitespace from ODP text:s elements
- Refactor protocol generation process, include more GBIF data in it
- Scroll to highlighted box in list
- Show final dimensions on crop boxes in list
- Support markdown in metadata option descriptions (Closes #115)
- Surface metadata merging errors
- Use markdown in description

### Bug Fixes

- Fix various zip export errors, use jsdoc @import in some places
- Add missing manuallyModified prop in results json schema
- Also delete references to image in observations when deleting image
- Cachebust protocol update checks and upgrades
- Fix Digit\* keybinds not triggering with shift-row
- Fix blurfill on CardObservation being short
- Fix bounding boxes on CardObservation misaligned
- Fix cannot create new boxes
- Fix cannot mark as confirmed when no bounding boxes
- Fix cannot mark as confirmed when no bounding boxes on image
- Fix i18n
- Fix invalid URL for arthropods protocol species URLs from Google Slides
- Fix metadata combobox displayed under selected card (Fixes #234)
- Fix missing dimensions property when creating new Image of new bounding box
- Fix renovate config
- Fix stretched bounding box thumbnails
- Fix version incrementation for example protocol generation
- Handle cropConfirmation-less protocols
- Hide autoscroll indicator on Firefox
- Mark whole ImageFile as confirmed when creating a new box
- Maybe fix ghost box from pervious image when autoskipping
- Prevent moving/resizing boxes with mousewheel click or while panning
- Remove $ark.object table keys from generate json schemas
- Restore observation IDs when importing a results zip file
- Show sidepanel even when there are only files that aren't imported yet
- Try fixing sequence numbers still not stable-ordered by changing ordering key
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
- Name example protocol appropriately
- Protocol generation: also use CC-BY-NC GBIF photos, credit even when no reference page
- Regenerate arthropods protocol
- Rename example protocol
- Use real Google Drive folder url

## April 2025

### Improvements

- Get rid of builtin protocol, preload arthropods transect
- Add MetadataValue.manuallyModified, shown in export analysis json too
- Add a keyboard shortcut for autoskip mode toggle
- Add bouding box!!
- Add button to revert to infered crop, add clickable unconfirmed crop empty seal
- Add custom corner cursors for 4point-mode (Closes #203)
- Add focus button
- Add hint to create new box
- Add keyboard hints for per-box actions, add revert to initial keyboard
- Allow creating crop box in any drag direction with select&drag (Closes #204)
- Allow dragging sides of the crop box
- Back button and basic keybinds
- Bounding box creation & auto-skip
- CSS-based cropping works!!!!
- Cram more cards per line, justify with space-around (Closes #191)
- Don't preemptively open cropper to first image when going from import tab
- Finish revert button, add (un)confirm toggle
- Highlight and scroll to element we were on when going back to crop gallery view
- Implement 2/4-point crop and move tool
- Improve appearance of global confirmed status icon
- Improve spacing for auto toggle
- Make --bg2 nicer in dark mode
- Make 4point mode work in any order
- Make confirming a crop more explicit
- Make cropping progress clearer
- Make protocol cards a bit narrower
- Mention that cigale autosaves stuff
- Put keyboard shortcut hints in tooltips
- Redesign protocol cards in /protocols
- Restore current protocol from local storage explicitly
- Retain crop page state (which image we're cropping) and select first image when going to tab for the first time
- Rework cropper navigation, add continue button
- Set tab title
- Set tab title for crop/[image], make them properly reactive
- Show when a image has a confirmed crop, improve icons
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
- Fix deletion of classification metadata when crop changes
- Fix import tab
- Fix interpolation of point index in debug display
- Fix leftover bounding box when switching to new image
- Fix missing pixels for precise bounding box display
- Fix revertToInferedCrop()
- Force light-theme colors for drag handles
- Prevent creating bounding boxes outside the image
- Prevent triggering keyboard shortcuts when a modal is open
- Recompute change area dimensions when image source changes
- Refresh cropper image rect on image load event (Fixes #206, fixes #205)
- Remove debug saveAsFile feur.jpeg
- Round percentages for crop
- Storred infered EXIF metadata values when _not_ NaN (Fixes #194)
- Temporarily disable image duplication when multiple crop boxes exist

### Data Updates

- Add a .v2 version of the protocol
- Fix favicon
- Pull .v2 protocol
- Regenerate arthropods protocol

## March 2025

### Improvements

- Allow ey and ex output tokens for detection model
- AAAAAAAAAAAAAAAAAAAAAAAA
- Add about page (not linked anywhere for now lol)
- Add feedback for loading/error states when exporting results
- Add proper model loading/error states, touch up global layout and navbar
- Add top-level crash handling and reorganize pages
- Add util functions to convert to AreaObservation's props object
- Add value labels for enum metadata in results analysis.json
- Add wikipedia links for options of species metadata
- Add yaml potocol deinition import
- Afficher l'aide des raccourcis dans la molette (closes #61)
- Allow AreaObservations to pass down bounding boxes
- Allow all 2-subsets of cx/sx/ex/w and cy/sy/ey/h atoms
- Allow deleting selection via Delete key
- Allow downloading a protocol definition template
- Allow importing multiple protocols at once
- Allow page to let toAreaObservationProps know what is a loaded image
- Allow protocols to define results.zip structure
- Allow quick import+select of protocol from /
- Allow resizing sidepanel (closes #53)
- Allow showing bounding boxes on CardObservation
- Also export a .csv file
- Analyze on import
- Ask for the protocol to use before doing anything else (Closes #75)
- Bounding Boxes
- C'est le début de la barre de navigation
- Choisir si on veut les images ou pas dans le téléchargement (closes #68)
- Define a real Transect protocol
- Disable merge button when less than 2 images are selected
- Display unrepresentable metadata values better
- Don't show bare images' cards when they are part of an observation
- Don't show preview sidepanel on crop page
- Ensure current tab is always valid for the current state
- Explicit loading screen for model loading
- Finish dark theme
- Fix & improve side panel, always show all metadata of the protocol
- Global progress bar, selection state sync & restoration
- Handle error states on images/observations
- Implement EXIF metadata extraction and bulk value writing
- Implement confidence and probability merging
- Implement observation merging/splitting and bulk image deletion
- Improve UI in some places, add "technical metadata" toggle, make crop a technical metadata, fix shortcuts
- Improve default observation label, allow changing observation label, show selection count/filename/label in sidepanel
- Improve empty states for import page and sidepanel
- Improve error messages on protocol imports
- Improve key order of exported protocol files
- Include confidence scores in CSV output
- Include valueLabel in images in analysis.json
- Infer taxonomic lineage recursively
- Intersperse observations and images, using their images' biggest id to sort
- Link side panel to state & db, centralize keyboard shorcuts, fix layout
- Make crop box more visible
- Make it work uwu
- Make navbar more centered
- Make usage of builtin metadata in protocol definitions clear
- Merge observations, download results zip file
- Persist current protocol ID
- Petit makup side pannel
- Reanalyze metadata.species if metadata.crop changes (closes #71)
- Redesign sidepanel
- Réglages
- Save uploaded images to database
- Select newly created observation after merge
- Selected newly created observation/images when grouping / ungrouping (closes #64)
- Set species' taxonomic lineage on species metadata value change
- Show cropped images on cards in classify step
- Show model source when loading or errored
- Show placeholder image when previewURL does not exist yet (closes #54)
- Split images after inferring crops
- Store bounding boxes in YOLO format
- Trois fois rien
- Turn all lone images into observations when arriving at classify page
- Use a map of id: metata in protocol exports instead of a list
- Use transaction for ctrl-u
- le preview pannel la o

### Performance Improvements

- Rendre le site installable et dispo offline (#92)

### Accessibility Improvements

- Add tooltip to settings nav button
- Ensure all ButtonIcon have a tooltip
- Make crop box & handles more visible in Cropup

### Bug Fixes

- Fix empty or out of date combobox
- Fix scrollbars lookin horrible on Chrome, and various other small things
- Add missing clade class in taxonomy
- Correctly namespace protocol metadata defs on import
- Define isLoading in crop page
- Don't include learnMore: null in generated protocol
- Don't trigger custom handling for Ctrl+A when inside an input
- Fix 0-key species displayed as (Unknown) in exported folder
- Fix asset URLs for model files in service worker
- Fix bounding box not showing on observation cards
- Fix csv export not showing enum labels for number-like enum keys
- Fix db state initialization
- Fix deletion not worky
- Fix deployment details modal not showing anything next to user picture if they have no displayname
- Fix disabled states for navigation tabs
- Fix excessive toRelativeCoords translation when storing inferred crop box
- Fix extracted exif date is incredibly wrong (closes #49)
- Fix ghost items left in selection after lone images fix when exporting
- Fix keyboard handlers executing more than once
- Fix logo size broked in Chrome
- Fix metadata display in sidepanel for observations
- Fix metadata merging logic
- Fix metadata values sometimes deserialized as dates because ISO 8601 is fucking insane
- Fix modal not centered, and could be closed by clicking on empty content inside
- Fix model input dimensions were switched around for jessica joachim
- Fix nav links
- Fix nav links not working on preview deployments
- Fix problems when opening new versions of the site since db schema changed
- Fix progress bar set total early when dropping new files (closes #50)
- Fix redirect to protocol choice page
- Fix some bugs, make date input work
- Fix split observation keybind (closes #62)
- Fix sw not actually using cache-models when matching a model request
- Fix taxonomy.json path on non-root-base deployments
- Fix various cute bugs
- Fix weird glitches when cards change
- Fix weird state desync on selection
- Fix weird things when merging observations
- Fix wide-docs combobox style
- Fix wrong bounding box when editing it
- Fix wrong details for related issue in DeploymentDetails
- Huuuuuuuuuuuuuuh fix some stuff ig
- Include images' metadata in analysis.json (closes #66)
- Loading spinner is way bigger than button icon when downloading results (closes #52)
- Maybe fix max/min strategy merging
- Only serve model files from cache when online
- Prevent badly shrinking images in combobox
- Prevent error when exporting results if an observation has less metadata than another
- Run classification on correct bounding box coords
- Shown crop box did not always match chosen thumbnail for stacked cards (closes #63)
- Turn lone images into 1-image observations before exporting

### Data Updates

- Add model declarations
- Bdd + reglages Ok mais pas modification
- Define species metadata enum using classpath
- Download models from media.gwen.works for now, because Git LFS and Gitlab suck ass
- Host model files on github instead
- Maintenant c'est plus jol
- No lfs, come back plz </3
- Regenerate arthropods protocol
- Reglages ok ?
- Use CNRS drive URLs for hosting model files

## February 2025

### Improvements

- AAAAAAAAAAAAa
- Add ButtonFloating
- Add TextArea
- Add feur
- Add keyboard shortcuts help popup when pressing "?" [REQUIRES GWENN/POPUP]
- Add toasts system (closes #23)
- Add toasts.success
- Add util functions for manipulating metadata, add more to database utils
- Adding onOff switch
- Bouton secondaire
- Create root layout
- Creation de la feature #14
- Define exportProtocol and importProtocol
- Export protocol files JSON schema!
- Finish toasts!!!
- Implement CardObservation
- Implement Modal (Closes #11)
- Implement ModalConfirm
- Implement file uploading
- Implement modal
- Implement multiselect through drag or keyboard shorcuts
- Implement shift-click selection!!
- Import tensorflow PoC from @tianoc
- InkButton
- Loading states, checkmark animation, clickable stacksize count, attrs forwarding
- Make hover state even prettier ^w^
- Make stacksize count bubble more subtle
- Only show title tooltip when title is ellipsed
- Prevent selecting text while dragging-select images
- RadioButton + Syling
- Re-add cursor: pointer to card
- Réglages
- Setup database!!
- Setup tooltips (closes #24)
- Tentative de dark mode
- Una metabannanna
- Use parent element of component for selection zone
- Use real colors for TextArea

### Accessibility Improvements

- Support prefers-reduced-motion

### Bug Fixes

- Balise Div qui manquait
- Fix /\_components and preview deployments
- Fix \_components not updating URL properly after setting props
- Fix descending shift-click selections
- Fix overflow of toasts on long messages
- Fix title jump when single-image observation gets selected/unselected
- Fix title unecessarily ellipsed when single-image
- J'espère que ça marche
- J'y crois encore
- Je croise les doigts
- Je pleure mais on croise les doigts
- Let DragSelect handle selection-by-click
- On a rien vu
- Prevent drag-selection from working outside of images container
- Prevent hover/focus styles for loading-state cards
- Ça se déploie pas

### Data Updates

- Add --bg-primary-translucent
- Add database typedefs and diagram
- Button bind:group add
- Button but better
- Cette fois c'est VRAIMENT la bonne pour reglages
- Changement imports
- Cécentrépaskegwennaditquifoksassoicentré
- Diversify example image sources
- Début de liste sympa pas fini mais cool
- Import fonts
- J'ai enlevé l'ombre
- Oui
- Radio Changes
- Radio button + Global CSS Color
- Radio button but better
- Réglages 2.0
