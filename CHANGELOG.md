# Changelog

All notable changes to this project will be documented in this file, on a monthly basis, with a consistent, simple format: month/year heading > type of change heading > list of changes.

## August 2025

### Improvements

- Add a separate pool for toasts originating in modals
- Add progress percentage in browser tab title
- Display proper .cr2 import error toast on linux
- Don't abort results zip generation if EXIF write fails
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
