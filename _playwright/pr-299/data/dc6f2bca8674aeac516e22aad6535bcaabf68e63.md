# Test info

- Name: Cropper view >> creating a new bounding box >> with click-and-drag tool >> should mark the image as confirmed if image was untouched
- Location: /home/runner/work/cigale/cigale/tests/cropper.spec.js:224:4

# Error details

```
Error: locator.click: Test ended.
Call log:
  - waiting for getByRole('img', { name: 'lil-fella.jpeg' })

    at /home/runner/work/cigale/cigale/tests/cropper.spec.js:153:60
```

# Page snapshot

```yaml
- dialog:
  - banner:
    - heading "Exporter les résultats" [level=1]
    - button:
      - img
  - main:
    - radio "Métadonnées seulement"
    - text: Métadonnées seulement
    - radio "Métadonnées et images recadrées" [checked]
    - text: Métadonnées et images recadrées
    - radio "Métadonnées, images recadrées et images originales Permet de ré-importer les résultats ultérieurement"
    - text: Métadonnées, images recadrées et images originales
    - paragraph: Permet de ré-importer les résultats ultérieurement
  - contentinfo:
    - button "results.zip":
      - img
      - text: results.zip
- banner:
  - navigation:
    - link "C.i.g.a.l.e.":
      - /url: "#/"
      - img
      - text: C.i.g.a.l.e.
    - link "Protocole":
      - /url: "#/"
    - img
    - link "Importer" [disabled]:
      - /url: "#/import"
    - img
    - link "Recadrer" [disabled]:
      - /url: "#/crop/"
    - img
    - link "Classifier" [disabled]:
      - /url: "#/classify"
    - img
    - button "Résultats":
      - img
      - text: Résultats
    - button:
      - img
    - dialog:
      - text: Thème
      - switch "on/off switch" [checked]:
        - img
      - button [disabled]:
        - img
      - text: Mode debug
      - switch "on/off switch":
        - img
      - button "Gérer les protocoles"
      - button "Raccourcis clavier"
      - text: C.i.g.a.l.e vDEV ·
      - link "À propos":
        - /url: "#/about"
- dialog:
  - banner:
    - heading "Raccourcis clavier" [level=1]
    - button:
      - img
  - main:
    - text: ¯\_(ツ)_/¯
    - paragraph: Aucun raccouci clavier pour cette page
- heading "Choisir un protocole" [level=1]
- list:
  - listitem:
    - img
    - textbox "Recherche"
  - listitem:
    - 'button "Example: arthropodes"'
    - button:
      - img
- paragraph: Le protocole que vous souhaitez n'est pas disponible?
- button "Gérer les protocoles":
  - img
  - text: Gérer les protocoles
- button "Importer un protocole":
  - img
  - text: Importer un protocole
- text: Choisir un protocole · Cigale
```

# Test source

```ts
   53 | 				await page.getByText('leaf.jpeg', { exact: true }).click();
   54 | 				await page.waitForURL((u) => u.hash === '#/crop/000001');
   55 | 				await page.keyboard.press('Escape');
   56 | 				await page.waitForURL((u) => u.hash === '#/crop');
   57 | 				await expect(page.getByText('lil-fella.jpeg', { exact: true })).toBeVisible();
   58 | 				await expect(page.getByText('cyan.jpeg', { exact: true })).toBeVisible();
   59 | 				await expect(page.getByText('leaf.jpeg', { exact: true })).toBeVisible();
   60 | 			});
   61 | 		}
   62 | 	});
   63 |
   64 | 	test.describe('autoskip disabled', () => {
   65 | 		test.beforeEach(async ({ page }) => {
   66 | 			await setSettings({ page }, { cropAutoNext: false });
   67 | 		});
   68 |
   69 | 		test('should not skip on confirm button click', async ({ page }) => {
   70 | 			await page.getByText('leaf.jpeg', { exact: true }).click();
   71 | 			await page.waitForURL((u) => u.hash === '#/crop/000001');
   72 | 			await page.waitForTimeout(1000);
   73 | 			await page.getByRole('button', { name: 'Continuer' }).click();
   74 | 			await page.waitForURL((u) => u.hash === '#/crop/000001');
   75 | 			await expect(page.getByText('leaf.jpeg', { exact: true })).not.toBeVisible();
   76 | 		});
   77 |
   78 | 		test('should not skip on confirmation keybind', async ({ page }) => {
   79 | 			await page.getByText('leaf.jpeg', { exact: true }).click();
   80 | 			await page.waitForURL((u) => u.hash === '#/crop/000001');
   81 | 			await page.waitForTimeout(1000);
   82 | 			await page.keyboard.press('Space');
   83 | 			await page.waitForURL((u) => u.hash === '#/crop/000001');
   84 | 			await expect(page.getByText('leaf.jpeg', { exact: true })).not.toBeVisible();
   85 | 		});
   86 |
   87 | 		test('should toggle autoskip on on keybind press', async ({ page }) => {
   88 | 			await page.getByText('leaf.jpeg', { exact: true }).click();
   89 | 			await page.waitForURL((u) => u.hash === '#/crop/000001');
   90 |
   91 | 			const { cropAutoNext: _, ...othersBefore } = await getSettings({ page });
   92 | 			await page.keyboard.press('a');
   93 | 			const { cropAutoNext, ...othersAfter } = await getSettings({ page });
   94 |
   95 | 			expect(cropAutoNext).toBe(true);
   96 | 			expect(othersBefore).toMatchObject(othersAfter);
   97 | 		});
   98 | 	});
   99 |
  100 | 	test.describe('autoskip enabled', () => {
  101 | 		test.beforeEach(async ({ page }) => {
  102 | 			await setSettings({ page }, { cropAutoNext: true, showTechnicalMetadata: true });
  103 | 		});
  104 |
  105 | 		test('should skip on confirm button click', async ({ page }) => {
  106 | 			await page.getByText('leaf.jpeg', { exact: true }).click();
  107 | 			await page.waitForURL((u) => u.hash === '#/crop/000001');
  108 | 			await page.waitForTimeout(1000);
  109 | 			await page.getByRole('button', { name: 'Continuer' }).click();
  110 | 			await page.waitForURL((u) => u.hash === '#/crop/000002');
  111 | 			await expect(page.getByText('lil-fella.jpeg', { exact: true })).toBeVisible();
  112 | 		});
  113 |
  114 | 		test('should skip on confirmation keybind', async ({ page }) => {
  115 | 			await page.getByText('leaf.jpeg', { exact: true }).click();
  116 | 			await page.waitForURL((u) => u.hash === '#/crop/000001');
  117 | 			await page.waitForTimeout(1000);
  118 | 			await page.keyboard.press('Space');
  119 | 			await page.waitForURL((u) => u.hash === '#/crop/000002');
  120 | 			await expect(page.getByText('lil-fella.jpeg', { exact: true })).toBeVisible();
  121 | 		});
  122 |
  123 | 		test('should toggle autoskip off on keybind press', async ({ page }) => {
  124 | 			await page.getByText('leaf.jpeg', { exact: true }).click();
  125 | 			await page.waitForURL((u) => u.hash === '#/crop/000001');
  126 |
  127 | 			const { cropAutoNext: _, ...othersBefore } = await getSettings({ page });
  128 | 			await page.keyboard.press('a');
  129 | 			const { cropAutoNext, ...othersAfter } = await getSettings({ page });
  130 |
  131 | 			expect(cropAutoNext).toBe(false);
  132 | 			expect(othersBefore).toMatchObject(othersAfter);
  133 | 		});
  134 |
  135 | 		test('should autoskip to classify when all images are confirmed', async ({ page }) => {
  136 | 			await markImagesAsConfirmedInDatabase(
  137 | 				page,
  138 | 				await listTable(page, 'Image').then((images) =>
  139 | 					images.filter(({ fileId }) => fileId !== '000003').map(({ id }) => id)
  140 | 				)
  141 | 			);
  142 |
  143 | 			await page.getByText('with-exif-gps.jpeg', { exact: true }).click();
  144 | 			await page.waitForURL((u) => u.hash === '#/crop/000003');
  145 | 			await page.getByRole('button', { name: 'Continuer' }).click();
  146 | 			await page.waitForTimeout(1000);
  147 | 			expect(page.url()).toMatch(/#\/classify/);
  148 | 		});
  149 | 	});
  150 |
  151 | 	test.describe('creating a new bounding box', () => {
  152 | 		test.beforeEach(async ({ page }) => {
> 153 | 			await page.getByRole('img', { name: 'lil-fella.jpeg' }).click();
      | 			                                                        ^ Error: locator.click: Test ended.
  154 | 		});
  155 |
  156 | 		/**
  157 | 		 * Expects that all the images of leaf.jpeg are marked as confirmed or unconfirmed in the database.
  158 | 		 * @param {import('@playwright/test').Page} page
  159 | 		 * @param {boolean} confirmed
  160 | 		 */
  161 | 		async function expectAllImagesConfirmedInDatabase(page, confirmed) {
  162 | 			const boxesCount = await boxesInBoxesList(page).count();
  163 | 			for (let i = 0; i < boxesCount; i++) {
  164 | 				await expect(isImageConfirmedInDatabase(page, `000002_00000${i}`)).resolves.toBe(confirmed);
  165 | 			}
  166 | 		}
  167 |
  168 | 		/**
  169 | 		 * Checks that the ImageFile is confirmed:
  170 | 		 * - has the "Confirmé" overlay shown (if `implicit` is true)
  171 | 		 * - has the confirmed badge shown
  172 | 		 * - has all images marked as confirmed in the database
  173 | 		 * - has the "Invalider" button shown
  174 | 		 * @param {import('@playwright/test').Page} page
  175 | 		 * @param {boolean} implicit also check that the overlay is shown
  176 | 		 */
  177 | 		async function expectConfirmed(page, implicit = false) {
  178 | 			if (implicit) await expect(confirmedCropOverlay(page)).toBeVisible();
  179 | 			await expect(confirmedCropBadge(page)).toBeVisible();
  180 | 			await expect(page.getByRole('button', { name: 'Invalider' })).toBeVisible();
  181 | 			await expectAllImagesConfirmedInDatabase(page, true);
  182 | 		}
  183 |
  184 | 		test.describe('with click-and-drag tool', () => {
  185 | 			test.beforeEach(async ({ page, browserName }) => {
  186 | 				test.skip(
  187 | 					browserName === 'webkit',
  188 | 					'No support for click-and-drag, trace viewer shows that the mouse down is seemingly immediately followed by a mouse up, so no dragging occurs'
  189 | 				);
  190 |
  191 | 				await page.getByRole('button', { name: 'Glisser-recadrer' }).click();
  192 | 			});
  193 |
  194 | 			/**
  195 | 			 * Make a new cropb box by clicking and dragging from the first point to the second. Assumes the click-and-drag tool is selected.
  196 | 			 * @param {import('@playwright/test').Page} page
  197 | 			 * @param {number} x1
  198 | 			 * @param {number} y1
  199 | 			 * @param {number} x2
  200 | 			 * @param {number} y2
  201 | 			 */
  202 | 			async function makeBox(page, x1, y1, x2, y2) {
  203 | 				await page.waitForTimeout(500);
  204 | 				const changeArea = await page.locator('.change-area').boundingBox();
  205 | 				if (!changeArea) throw new Error('Change area not found');
  206 | 				const { x: x0, y: y0 } = changeArea;
  207 | 				await page.mouse.move(x0 + x1, y0 + y1);
  208 | 				await page.mouse.down();
  209 | 				await page.mouse.move(x0 + (x2 - x1), y0 + (y2 - y1));
  210 | 				await page.mouse.up();
  211 | 			}
  212 |
  213 | 			test('should create boxes on mouseup', async ({ page }) => {
  214 | 				await makeBox(page, 10, 10, 50, 50);
  215 | 				await expectBoxInList(page, 2, 245, 245);
  216 | 				await makeBox(page, 100, 100, 340, 120);
  217 | 				// Wait for overlay from the first box to disappear
  218 | 				await page.waitForTimeout(500);
  219 | 				await expect(confirmedCropOverlay(page)).not.toBeVisible();
  220 | 				await expectBoxInList(page, 3, 1143, 653);
  221 | 				await expect(boxesInBoxesList(page)).toHaveCount(3);
  222 | 			});
  223 |
  224 | 			test('should mark the image as confirmed if image was untouched', async ({ page }) => {
  225 | 				await expectAllImagesConfirmedInDatabase(page, false);
  226 | 				await makeBox(page, 10, 10, 50, 50);
  227 | 				await expectBoxInList(page, 2, 245, 245);
  228 | 				await expectConfirmed(page, true);
  229 | 			});
  230 | 		});
  231 |
  232 | 		test.describe('with 2-point tool', () => {
  233 | 			test.beforeEach(async ({ page }) => {
  234 | 				await page.getByRole('button', { name: '2 points' }).click();
  235 | 			});
  236 |
  237 | 			/**
  238 | 			 * Make a new cropb box by clicking on two given points. Assumes the 2-point tool is selected.
  239 | 			 * @param {import('@playwright/test').Page} page
  240 | 			 * @param {number} x1
  241 | 			 * @param {number} y1
  242 | 			 * @param {number} x2
  243 | 			 * @param {number} y2
  244 | 			 */
  245 | 			async function makeBox(page, x1, y1, x2, y2) {
  246 | 				await page.waitForTimeout(500);
  247 | 				await page.locator('.change-area').click({
  248 | 					position: { x: x1, y: y1 }
  249 | 				});
  250 | 				await page.locator('.change-area').click({
  251 | 					position: { x: x2, y: y2 }
  252 | 				});
  253 | 			}
```

# Local changes

```diff
diff --git a/package-lock.json b/package-lock.json
index 541f137..71aab95 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -27,6 +27,7 @@
 				"pica-gpu": "^0.2.0",
 				"piexifjs": "^1.0.6",
 				"runed": "^0.28.0",
+				"slugify": "^1.6.6",
 				"sveltejs-tippy": "^3.0.0",
 				"tinykeys": "^3.0.0",
 				"unplugin-icons": "^22.1.0",
@@ -10181,6 +10182,15 @@
 				"url": "https://github.com/chalk/ansi-styles?sponsor=1"
 			}
 		},
+		"node_modules/slugify": {
+			"version": "1.6.6",
+			"resolved": "https://registry.npmjs.org/slugify/-/slugify-1.6.6.tgz",
+			"integrity": "sha512-h+z7HKHYXj6wJU+AnS/+IH8Uh9fdcX1Lrhg1/VMdf9PwoBQXFcXiAdsy2tSK0P6gKwJLXp02r90ahUCqHk9rrw==",
+			"license": "MIT",
+			"engines": {
+				"node": ">=8.0.0"
+			}
+		},
 		"node_modules/smart-buffer": {
 			"version": "4.2.0",
 			"resolved": "https://registry.npmjs.org/smart-buffer/-/smart-buffer-4.2.0.tgz",
diff --git a/package.json b/package.json
index db1f0a0..30e437a 100644
--- a/package.json
+++ b/package.json
@@ -94,6 +94,7 @@
 		"pica-gpu": "^0.2.0",
 		"piexifjs": "^1.0.6",
 		"runed": "^0.28.0",
+		"slugify": "^1.6.6",
 		"sveltejs-tippy": "^3.0.0",
 		"tinykeys": "^3.0.0",
 		"unplugin-icons": "^22.1.0",
diff --git a/src/lib/InlineTextInput.svelte b/src/lib/InlineTextInput.svelte
index ee92d17..64c6c80 100644
--- a/src/lib/InlineTextInput.svelte
+++ b/src/lib/InlineTextInput.svelte
@@ -3,12 +3,13 @@
 	 * @typedef {object} Props
 	 * @property {string} label
 	 * @property {string} value
+	 * @property {boolean} [discreet=false] don't show bottom border until hover/focus
 	 * @property {string} [placeholder]
-	 * @property {(newValue: string) => void | Promise<void>} onblur also triggered on component unmount
+	 * @property {(newValue: string, setValueTo: (v: string) => void) => void | Promise<void>} onblur also triggered on component unmount
 	 */
 
 	/** @type {Props} */
-	let { label, value = $bindable(), onblur, placeholder } = $props();
+	let { label, discreet, value = $bindable(), onblur, placeholder } = $props();
 
 	// FIXME Doesn't work - see https://discord.com/channels/457912077277855764/1349511706669224049 on Svelte Discord
 	// onDestroy(() => onblur(value));
@@ -17,22 +18,30 @@
 <input
 	aria-label={label}
 	class="inline-input"
+	class:discreet
 	bind:value
-	onblur={({ currentTarget }) => onblur(currentTarget.value)}
+	onblur={({ currentTarget }) => onblur(currentTarget.value, (v) => (value = v))}
 	{placeholder}
 />
 
 <style>
 	.inline-input {
 		display: inline-flex;
+		width: 100%;
 		border: none;
 		background-color: transparent;
-		color: var(--fg-neutral);
+		/* color: var(--fg-neutral); */
+		color: inherit;
 		font-size: 1em;
 		font-weight: inherit;
+		font-family: inherit;
 		border-bottom: 2px solid var(--fg-primary);
 	}
 
+	.inline-input.discreet:not(:hover):not(:focus-visible) {
+		border-color: transparent;
+	}
+
 	.inline-input:is(:hover, :focus-visible) {
 		border-color: var(--bg-primary);
 		outline: none;
diff --git a/src/lib/schemas/protocols.js b/src/lib/schemas/protocols.js
index 9f811ed..2ee9686 100644
--- a/src/lib/schemas/protocols.js
+++ b/src/lib/schemas/protocols.js
@@ -19,32 +19,35 @@ export const ModelDetectionOutputShape = type(['"cx"', '@', 'Coordonée X du poi
 	.or(type(['"_"', '@', 'Autre valeur (ignorée par CIGALE)']))
 	.array();
 
-/**
- * Add a suffix to a filename, before the extension
- */
-Handlebars.registerHelper('suffix', (subject, suffix) => {
-	type('string').assert(subject);
-	type('string').assert(suffix);
-
-	const [stem, ext] = splitFilenameOnExtension(subject);
-	return `${stem}${suffix}.${ext}`;
-});
-
-/**
- * Get the extension part from a filename
- */
-Handlebars.registerHelper('extension', (subject) => {
-	type('string').assert(subject);
+export const HANDLEBARS_HELPERS = {
+	suffix: {
+		documentation: "Ajoute un suffixe à un nom de fichier, avant l'extension",
+		implementation: (subject, suffix) => {
+			type('string').assert(subject);
+			type('string').assert(suffix);
 
-	return splitFilenameOnExtension(subject)[1];
-});
+			const [stem, ext] = splitFilenameOnExtension(subject);
+			return `${stem}${suffix}.${ext}`;
+		}
+	},
+	extension: {
+		documentation: 'Récupère l’extension d’un nom de fichier',
+		implementation: (subject) => {
+			type('string').assert(subject);
+			return splitFilenameOnExtension(subject)[1];
+		}
+	},
+	fallback: {
+		documentation: 'Fournit une valeur de repli si la première est indéfinie',
+		implementation: (subject, fallback) => {
+			return subject ?? fallback;
+		}
+	}
+};
 
-/**
- * Provide a default, akin to a ?? b
- */
-Handlebars.registerHelper('fallback', (subject, fallback) => {
-	return subject ?? fallback;
-});
+for (const [name, { implementation }] of Object.entries(HANDLEBARS_HELPERS)) {
+	Handlebars.registerHelper(name, implementation);
+}
 
 export const FilepathTemplate = type.string
 	.pipe((t) => {
diff --git a/src/lib/seo.svelte.js b/src/lib/seo.svelte.js
index 69ef2a2..4ed7c3e 100644
--- a/src/lib/seo.svelte.js
+++ b/src/lib/seo.svelte.js
@@ -4,12 +4,23 @@
  * @param {string} options.title
  */
 export function seo({ title }) {
-	if ($effect.tracking()) {
+	effectIfNeeded(() => {
 		document.title = title ? `${title} · Cigale` : 'Cigale';
+	});
+}
+
+/**
+ *
+ * @param {() => unknown} fn
+ * @returns
+ */
+function effectIfNeeded(fn) {
+	if ($effect.tracking()) {
+		fn();
 		return;
 	}
 
 	$effect(() => {
-		document.title = title ? `${title} · Cigale` : 'Cigale';
+		fn();
 	});
 }
diff --git a/src/routes/(app)/+layout.svelte b/src/routes/(app)/+layout.svelte
index df18216..8355290 100644
--- a/src/routes/(app)/+layout.svelte
+++ b/src/routes/(app)/+layout.svelte
@@ -84,7 +84,9 @@
 
 <div
 	class="contents"
-	class:padded={!page.route.id?.includes('/(sidepanel)') && page.route.id !== '/(app)/crop/[image]'}
+	class:padded={!page.route.id?.includes('/(sidepanel)') &&
+		page.route.id !== '/(app)/crop/[image]' &&
+		!page.route.id?.includes('protocols/[id]/')}
 >
 	{@render children?.()}
 </div>
diff --git a/src/routes/(app)/Navigation.svelte b/src/routes/(app)/Navigation.svelte
index 988ebfd..7e1dacc 100644
--- a/src/routes/(app)/Navigation.svelte
+++ b/src/routes/(app)/Navigation.svelte
@@ -32,8 +32,10 @@
 	let openExportModal = $state();
 
 	$effect(() => {
-		if (!uiState.currentProtocolId) goto('#/');
-		if (uiState.currentProtocolId && !hasImages) goto('#/import');
+		if (!page.route.id?.includes('/protocols/')) {
+			if (!uiState.currentProtocolId) goto('#/');
+			if (uiState.currentProtocolId && !hasImages) goto('#/import');
+		}
 	});
 
 	/** @type {undefined | (() => void)} */
diff --git a/src/routes/(app)/protocols/CardProtocol.svelte b/src/routes/(app)/protocols/CardProtocol.svelte
index 5bed3a7..045094f 100644
--- a/src/routes/(app)/protocols/CardProtocol.svelte
+++ b/src/routes/(app)/protocols/CardProtocol.svelte
@@ -76,7 +76,7 @@
 		<h2>
 			{name}
 		</h2>
-		<code class="id">{id}</code>
+		<a href="#/protocols/{id}/exports"> <code class="id">{id}</code></a>
 		<p class="description">
 			{description}
 		</p>
diff --git a/src/routes/(app)/protocols/[id]/+layout.js b/src/routes/(app)/protocols/[id]/+layout.js
new file mode 100644
index 0000000..6ab705e
--- /dev/null
+++ b/src/routes/(app)/protocols/[id]/+layout.js
@@ -0,0 +1,8 @@
+import { tables } from '$lib/idb.svelte.js';
+import { error } from '@sveltejs/kit';
+
+export async function load({ params }) {
+	const protocol = await tables.Protocol.get(params.id);
+	if (!protocol) error(404, `Protocole ${params.id} introuvable`);
+	return protocol;
+}
diff --git a/src/routes/(app)/protocols/[id]/+layout.svelte b/src/routes/(app)/protocols/[id]/+layout.svelte
new file mode 100644
index 0000000..f87d328
--- /dev/null
+++ b/src/routes/(app)/protocols/[id]/+layout.svelte
@@ -0,0 +1,163 @@
+<script>
+	import { page } from '$app/state';
+	import InlineTextInput from '$lib/InlineTextInput.svelte';
+	import { tables } from '$lib/idb.svelte.js';
+	import { removeNamespaceFromMetadataId } from '$lib/protocols';
+	import { seo } from '$lib/seo.svelte';
+	import IconVersioning from '~icons/ph/arrow-circle-up';
+	import IconCropping from '~icons/ph/crop';
+	import IconExports from '~icons/ph/file-archive';
+	import IconInfo from '~icons/ph/info';
+	import IconMetadata from '~icons/ph/list-bullets';
+
+	seo({ title: `Protocole ${page.params.id}` });
+
+	const { children, data } = $props();
+	let { id, name } = $derived(data);
+</script>
+
+<div class="sidebar-and-main">
+	<aside>
+		<heading>
+			<h1>
+				<InlineTextInput
+					label="Nom du protocole"
+					discreet
+					value={name}
+					onblur={async (newname) => {
+						await tables.Protocol.update(id, 'name', newname);
+						name = newname;
+					}}
+				/>
+			</h1>
+			<code class="subtitle">
+				<InlineTextInput
+					label="ID du protocole"
+					discreet
+					value={id}
+					onblur={async (newid) => {
+						await tables.Protocol.update(id, 'id', newid);
+						id = newid;
+					}}
+				/>
+			</code>
+		</heading>
+
+		<nav>
+			{@render navlink('Informations', 'infos', IconInfo)}
+			{@render navlink('Versioning', 'versioning', IconVersioning)}
+			{@render navlink('Exports', 'exports', IconExports)}
+			{@render navlink('Recadrage', 'cropping', IconCropping)}
+			{@render navlink('Métadonnées', 'metadata', IconMetadata)}
+			<nav class="metadata">
+				{#each data.metadata as key (key)}
+					{#await tables.Metadata.get(key) then def}
+						<a
+							href="#/protocols/{id}/metadata/{removeNamespaceFromMetadataId(key)}/infos"
+							class:active={page.url.hash.includes(
+								`metadata/${removeNamespaceFromMetadataId(key)}/`
+							)}
+						>
+							<div class="icon-standin"></div>
+							{#if def?.label}
+								{def.label}
+							{:else}
+								<code>{removeNamespaceFromMetadataId(key)}</code>
+							{/if}
+						</a>
+					{/await}
+				{/each}
+			</nav>
+		</nav>
+	</aside>
+	<main>
+		{@render children()}
+	</main>
+</div>
+
+{#snippet navlink(
+	/** @type {string} */ name,
+	/** @type {string} */ href,
+	/** @type {import('svelte').Component} */ Icon
+)}
+	<a
+		href="#/protocols/{id}/{href}"
+		class="navlink"
+		class:active={page.route.id?.includes(`/protocols/[id]/${href}`)}
+	>
+		<Icon />
+		{name}
+	</a>
+{/snippet}
+
+<style>
+	.sidebar-and-main {
+		display: flex;
+		height: 100%;
+	}
+
+	main {
+		overflow: auto;
+		width: 100%;
+	}
+
+	aside {
+		display: flex;
+		flex-direction: column;
+		gap: 2rem;
+		height: 100%;
+		border-right: 1px solid var(--gray);
+		padding: 1.2em;
+	}
+
+	h1 {
+		font-weight: normal;
+		font-size: 2em;
+		line-height: 1;
+	}
+
+	.subtitle {
+		color: var(--gray);
+	}
+
+	nav {
+		display: flex;
+		flex-direction: column;
+		gap: 0.75em;
+	}
+
+	nav a {
+		position: relative;
+		display: flex;
+		align-items: center;
+		gap: 0.5em;
+		text-decoration: none;
+	}
+
+	:global(svg),
+	.icon-standin {
+		width: 1.5em;
+		height: 1.5em;
+		flex-shrink: 0;
+	}
+
+	nav a :global(:is(svg, .icon-standin)) {
+		margin-left: calc(0.5em + 4px);
+	}
+
+	nav a::before {
+		content: '';
+		position: absolute;
+		height: 100%;
+		width: 4px;
+		border-radius: 10000px;
+	}
+
+	nav a.active::before {
+		background-color: var(--bg-primary);
+	}
+
+	nav a:not(.active):is(:hover, :focus-visible)::before {
+		background-color: var(--bg-primary-translucent);
+	}
+</style>
diff --git a/src/routes/(app)/protocols/[id]/cropping/+page.svelte b/src/routes/(app)/protocols/[id]/cropping/+page.svelte
new file mode 100644
index 0000000..e69de29
diff --git a/src/routes/(app)/protocols/[id]/exports/+page.js b/src/routes/(app)/protocols/[id]/exports/+page.js
new file mode 100644
index 0000000..b3feb98
--- /dev/null
+++ b/src/routes/(app)/protocols/[id]/exports/+page.js
@@ -0,0 +1,57 @@
+import { gatherToTree } from './utils.js';
+/**
+ * @import { TreeNode } from './utils.js';
+ */
+
+export async function load({ params, parent }) {
+	const protocol = await parent();
+
+	/**
+	 * @type {TreeNode}
+	 */
+	const nodes = [];
+
+	const {
+		images: { cropped, original },
+		metadata: { csv, json }
+	} = protocol.exports ?? {
+		images: {
+			cropped: { toJSON: () => 'cropped/{{ sequence }}.{{ extension image.filename }}' },
+			original: { toJSON: () => 'original/{{ sequence }}.{{ extension image.filename }}' }
+		},
+		metadata: {
+			csv: 'metadata.csv',
+			json: 'metadata.json'
+		}
+	};
+
+	gatherToTree({
+		tree: nodes,
+		provenance: 'metadata.csv',
+		path: csv,
+		help: 'Métadonnées des images exportées'
+	});
+
+	gatherToTree({
+		tree: nodes,
+		provenance: 'metadata.json',
+		path: json,
+		help: "Export JSON complet de l'analyse"
+	});
+
+	gatherToTree({
+		tree: nodes,
+		provenance: 'images.cropped',
+		path: cropped.toJSON(),
+		help: 'Images recadrées'
+	});
+
+	gatherToTree({
+		tree: nodes,
+		provenance: 'images.original',
+		path: original.toJSON(),
+		help: 'Images originales'
+	});
+
+	return { protocol, initialTree: nodes };
+}
diff --git a/src/routes/(app)/protocols/[id]/exports/+page.svelte b/src/routes/(app)/protocols/[id]/exports/+page.svelte
new file mode 100644
index 0000000..bf8d505
--- /dev/null
+++ b/src/routes/(app)/protocols/[id]/exports/+page.svelte
@@ -0,0 +1,233 @@
+<script>
+	import { page } from '$app/state';
+	import { tables } from '$lib/idb.svelte.js';
+	import InlineTextInput from '$lib/InlineTextInput.svelte';
+	import { seo } from '$lib/seo.svelte';
+	import { getSettings } from '$lib/settings.svelte';
+	import { toasts } from '$lib/toasts.svelte';
+	import IconZipFile from '~icons/ph/file-archive';
+	import IconJsonFile from '~icons/ph/file-code';
+	import IconCsvFile from '~icons/ph/file-csv';
+	import IconFolder from '~icons/ph/folder';
+	import IconFolderNew from '~icons/ph/folder-simple-dashed';
+	import IconFullImage from '~icons/ph/image';
+	import IconCroppedImage from '~icons/ph/image-square';
+
+	/**
+	 * @import { TreeNode, NodeProvenance } from './utils.js';
+	 */
+
+	/**
+	 *
+	 * @param {NodeProvenance} provenance
+	 * @return {import('svelte').Component}
+	 */
+	const iconOfNode = (provenance) => {
+		switch (provenance) {
+			case 'metadata.csv':
+				return IconCsvFile;
+			case 'metadata.json':
+				return IconJsonFile;
+			case 'images.cropped':
+				return IconCroppedImage;
+			case 'images.original':
+				return IconFullImage;
+		}
+	};
+
+	seo({ title: `Protocole ${page.params.id}: Export` });
+
+	const { data } = $props();
+	const treeNodes = $state(data.initialTree ?? []);
+
+	/**
+	 * @param {NodeProvenance} provenance
+	 * @param {string} path
+	 */
+	async function updateExportsPath(provenance, path) {
+		const [dotpathParent, dotpathChild] = provenance.split('.');
+
+		const { id, exports } = data.protocol;
+		if (!exports) {
+			toasts.error("Aucune configuration d'exports trouvée pour ce protocole.");
+			return;
+		}
+
+		const newExports = {
+			images: {
+				cropped: exports.images.cropped.toJSON(),
+				original: exports.images.original.toJSON()
+			},
+			metadata: {
+				csv: exports.metadata.csv,
+				json: exports.metadata.json
+			}
+		};
+
+		// @ts-expect-error
+		newExports[dotpathParent][dotpathChild] = path.replace(/^\//, '').replace(/\/$/, '');
+
+		await tables.Protocol.update(id, 'exports', newExports);
+	}
+
+	/**
+	 * @param {TreeNode} children
+	 * @param {string} dirname
+	 */
+	async function updateExportPaths(children, dirname) {
+		for (const child of children) {
+			if ('folder' in child) {
+				await updateExportPaths(child.children, `${dirname}/${child.folder}`);
+			} else {
+				await updateExportsPath(child.provenance, `${dirname}/${child.filename}`);
+			}
+		}
+	}
+</script>
+
+{#snippet tree(/** @type {TreeNode} */ children, /** @type {string} */ dirname = '')}
+	<ul class="tree">
+		<li class="new-folder">
+			<button>
+				<IconFolderNew />
+				<InlineTextInput
+					discreet
+					value=""
+					placeholder="Nouveau dossier"
+					label="Nom du dossier à créer"
+					onblur={(folder, setValue) => {
+						if (!folder.trim()) {
+							toasts.error('Le nom du dossier ne peut pas être vide.');
+							return;
+						}
+
+						setValue('');
+						children.push({ folder, children: [] });
+					}}
+				/>
+			</button>
+		</li>
+		{#each children as child ('folder' in child ? child.folder : child.filename)}
+			<li>
+				{#if 'folder' in child}
+					{@const Icon = child.icon ?? IconFolder}
+					<Icon />
+					<div class="text">
+						<InlineTextInput
+							discreet
+							value={child.folder}
+							label="Nom du dossier"
+							onblur={async (newName) => {
+								child.folder = newName;
+								await updateExportPaths(child.children, `${dirname}/${newName}`);
+							}}
+						/>
+					</div>
+				{:else}
+					{@const Icon = iconOfNode(child.provenance)}
+					<Icon />
+					<div class="text">
+						<span class="filename">
+							<InlineTextInput
+								discreet
+								value={child.filename}
+								label="Nom du fichier"
+								onblur={async (newName) => {
+									child.filename = newName;
+									await updateExportsPath(child.provenance, `${dirname}/${newName}`);
+								}}
+							/>
+						</span>
+						<span class="help">{child.help}</span>
+					</div>
+				{/if}
+			</li>
+			{#if 'children' in child}
+				{@render tree(child.children, `${dirname}/${child.folder}`)}
+			{/if}
+		{/each}
+	</ul>
+{/snippet}
+
+<ul class="tree">
+	<li>
+		<IconZipFile />
+		<span class="filename">Résultats.zip</span>
+	</li>
+	{@render tree(treeNodes, '')}
+</ul>
+
+{#if getSettings().showTechnicalMetadata}
+	<pre class="debug">{JSON.stringify(
+			tables.Protocol.state.find((p) => p.id === data.protocol.id)?.exports,
+			null,
+			2
+		)}</pre>
+{/if}
+
+<style>
+	ul {
+		--indent: 2rem;
+		list-style: none;
+		padding-left: var(--indent);
+		padding-top: 0.75rem;
+		gap: 0.75rem;
+		display: flex;
+		flex-direction: column;
+	}
+
+	.text {
+		display: flex;
+		flex-direction: column;
+		flex-grow: 1;
+		margin-left: 0.5rem;
+	}
+
+	.text .help {
+		font-size: 0.9em;
+		color: var(--gray);
+	}
+
+	ul ul {
+		position: relative;
+	}
+	ul ul::before {
+		content: '';
+		position: absolute;
+		width: 2px;
+		background-color: var(--fg-neutral);
+		/* XXX the -3px is pixel-perfect-fiddling because icons are a little slimmer than their whole bounding width. visual alignement, basically */
+		left: calc(var(--indent) / 2 - 2px - 3px);
+		top: 0;
+		bottom: 0;
+	}
+
+	ul ul li {
+		position: relative;
+	}
+	ul ul li::before {
+		content: '';
+		position: absolute;
+		left: calc(-1 * var(--indent) / 2 - 2px - 3px);
+		width: calc(var(--indent) / 2);
+		height: 2px;
+		background-color: var(--fg-neutral);
+	}
+
+	li,
+	li > button {
+		display: flex;
+		align-items: center;
+		gap: 0.5rem;
+	}
+	button {
+		font-size: 1rem;
+		border: none;
+		padding: 0;
+	}
+
+	pre.debug {
+		margin-top: 3rem;
+		font-size: 0.7em;
+	}
+</style>
diff --git a/src/routes/(app)/protocols/[id]/exports/utils.js b/src/routes/(app)/protocols/[id]/exports/utils.js
new file mode 100644
index 0000000..f4545bf
--- /dev/null
+++ b/src/routes/(app)/protocols/[id]/exports/utils.js
@@ -0,0 +1,134 @@
+/**
+ * @typedef {`metadata.${'json'|'csv'}`|`images.${'cropped'|'original'}`} NodeProvenance
+ */
+/**
+ * @typedef {object} TreeLeaf
+ * @property {string} filename
+ * @property {string} help
+ * @property {NodeProvenance} provenance
+ *
+ * @typedef {Array<TreeLeaf | { folder: string; icon?: import('svelte').Component; children: TreeLeaf[] }>} TreeNode
+ */
+
+/**
+ * Add a new path to the given tree (in-place).
+ * @param {object} arg
+ * @param {TreeNode} arg.tree
+ * @param {string} arg.path
+ * @param {boolean} [arg.isDirectory=false] whether the path is a directory
+ * @param {string} [arg.help]
+ * @param {NodeProvenance} arg.provenance
+ */
+export function gatherToTree({ tree, path, provenance, isDirectory = false, help = '' }) {
+	console.log('gatherToTree', { tree, path, provenance, isDirectory, help });
+	const [current, ...deeper] = splitPath(path);
+	if (deeper.length === 0) {
+		if (isDirectory) {
+			tree.push({ folder: current, provenance, children: [] });
+		} else {
+			tree.push({ filename: current, help, provenance });
+		}
+		return;
+	}
+
+	let folder = tree.find((f) => 'folder' in f && f.folder === current);
+	if (!folder) {
+		tree.push({ folder: current, children: [] });
+		folder = tree[tree.length - 1];
+	}
+
+	if (!('children' in folder)) {
+		throw new Error(`Expected folder "${current}" to have a children array`);
+	}
+
+	gatherToTree({
+		tree: folder.children,
+		path: deeper.join('/'),
+		provenance,
+		help
+	});
+}
+
+/**
+ * Split a path into parts (directory and basename), ignoring slashes inside {{}}
+ * @param {string} path
+ * @returns {string[]} fragments
+ */
+export function splitPath(path) {
+	let fragments = [];
+	let fragment = '';
+	let chars = path.split('');
+	let previousChar = '';
+	let char = '';
+	let insideBraces = false;
+
+	while (chars.length > 0) {
+		// @ts-expect-error chars.length > 0 implies !undefined
+		char = chars.shift();
+
+		if (char === '{' && previousChar === '{') {
+			insideBraces = true;
+		}
+
+		if (insideBraces && char === '}' && previousChar === '}') {
+			insideBraces = false;
+		}
+
+		if (!insideBraces && char === '/') {
+			if (fragment) fragments.push(fragment);
+			fragment = '';
+		} else {
+			fragment += char;
+		}
+
+		previousChar = char;
+	}
+
+	if (fragment) fragments.push(fragment);
+
+	return fragments;
+}
+
+if (import.meta.vitest) {
+	const { describe, it, expect } = import.meta.vitest;
+
+	describe('splitPath', () => {
+		it('should split a path into directory and basename', () => {
+			expect(splitPath('/path/to/file.txt')).toEqual(['path', 'to', 'file.txt']);
+			expect(splitPath('file.txt')).toEqual(['file.txt']);
+			expect(splitPath('/path/to/')).toEqual(['path', 'to']);
+			expect(splitPath('/path/with/{braces}/file.txt')).toEqual([
+				'path',
+				'with',
+				'{braces}',
+				'file.txt'
+			]);
+			expect(splitPath('/path/with/{{double-braces}}/file.txt')).toEqual([
+				'path',
+				'with',
+				'{{double-braces}}',
+				'file.txt'
+			]);
+			expect(splitPath('/path/with/{braces}/and/some/{{ 2 / 0 }}/file.txt')).toEqual([
+				'path',
+				'with',
+				'{braces}',
+				'and',
+				'some',
+				'{{ 2 / 0 }}',
+				'file.txt'
+			]);
+			expect(
+				splitPath('/path/with/{{double-braces}}/and/some/more/{{fallback file "/"}}.txt')
+			).toEqual([
+				'path',
+				'with',
+				'{{double-braces}}',
+				'and',
+				'some',
+				'more',
+				'{{fallback file "/"}}.txt'
+			]);
+		});
+	});
+}
diff --git a/src/routes/(app)/protocols/[id]/infos/+page.svelte b/src/routes/(app)/protocols/[id]/infos/+page.svelte
new file mode 100644
index 0000000..e69de29
diff --git a/src/routes/(app)/protocols/[id]/metadata/+page.svelte b/src/routes/(app)/protocols/[id]/metadata/+page.svelte
new file mode 100644
index 0000000..e69de29
diff --git a/src/routes/(app)/protocols/[id]/metadata/[metadata]/+layout.js b/src/routes/(app)/protocols/[id]/metadata/[metadata]/+layout.js
new file mode 100644
index 0000000..84eea26
--- /dev/null
+++ b/src/routes/(app)/protocols/[id]/metadata/[metadata]/+layout.js
@@ -0,0 +1,15 @@
+import { tables } from '$lib/idb.svelte.js';
+import { namespacedMetadataId } from '$lib/protocols';
+import { error } from '@sveltejs/kit';
+
+export async function load({ params, parent }) {
+	const protocol = await parent();
+	const id = namespacedMetadataId(protocol.id, params.metadata);
+	const metadata = await tables.Metadata.get(id);
+	if (!metadata) error(404, `Metadata ${id} for protocol ${protocol.id} not found`);
+
+	return {
+		protocol,
+		metadata
+	};
+}
diff --git a/src/routes/(app)/protocols/[id]/metadata/[metadata]/+layout.svelte b/src/routes/(app)/protocols/[id]/metadata/[metadata]/+layout.svelte
new file mode 100644
index 0000000..cf4a0eb
--- /dev/null
+++ b/src/routes/(app)/protocols/[id]/metadata/[metadata]/+layout.svelte
@@ -0,0 +1,124 @@
+<script>
+	import { page } from '$app/state';
+	import { removeNamespaceFromMetadataId } from '$lib/protocols.js';
+	import IconTaxonomy from '~icons/ph/graph';
+	import IconInfo from '~icons/ph/info';
+	import IconOptions from '~icons/ph/list-dashes';
+	import IconInference from '~icons/ph/magic-wand';
+
+	const { children, data } = $props();
+	const { id, label } = $derived(data.metadata);
+</script>
+
+<div class="header-and-scrollable">
+	<header>
+		<h2>
+			<span class="supertitle">Métadonnée</span>
+			<span class="title">{label || removeNamespaceFromMetadataId(id)}</span>
+			<code class="id">{id}</code>
+		</h2>
+
+		<nav>
+			{#snippet navlink(
+				/** @type {string} */ path,
+				/** @type {string} */ name,
+				/** @type {import('svelte').Component} */ Icon
+			)}
+				<a
+					href="#/protocols/{data.protocol.id}/metadata/{removeNamespaceFromMetadataId(id)}/{path}"
+					class:active={page.url.hash.includes(`/${path}`)}
+				>
+					<Icon />
+					{name}
+				</a>
+			{/snippet}
+
+			{@render navlink('infos', 'Informations', IconInfo)}
+			{@render navlink('options', 'Options', IconOptions)}
+			{@render navlink('inference', 'Inférence', IconInference)}
+			{@render navlink('taxonomy', 'Taxonomie', IconTaxonomy)}
+		</nav>
+	</header>
+
+	<div class="scrollable">{@render children()}</div>
+</div>
+
+<style>
+	.header-and-scrollable {
+		display: flex;
+		flex-direction: column;
+		height: 100%;
+	}
+
+	.scrollable {
+		overflow: auto;
+	}
+
+	header {
+		display: flex;
+		/* position: sticky; */
+		flex-direction: column;
+		/* top: 0; */
+		gap: 2rem;
+		padding: 2rem;
+		border-bottom: 1px solid var(--gay);
+	}
+
+	h2 {
+		display: flex;
+		flex-direction: column;
+	}
+
+	h2 * {
+		line-height: 1;
+	}
+
+	h2 .supertitle {
+		font-size: 0.7em;
+		text-transform: uppercase;
+		letter-spacing: 2px;
+	}
+
+	h2 .title {
+		font-weight: normal;
+		font-size: 2.5rem;
+	}
+
+	h2 .id {
+		font-size: 0.8em;
+		color: var(--gray);
+		font-weight: normal;
+	}
+
+	nav {
+		display: flex;
+		gap: 2rem;
+	}
+
+	nav a {
+		display: flex;
+		align-items: center;
+		gap: 0.5rem;
+		color: var(--text);
+		text-decoration: none;
+		position: relative;
+	}
+
+	nav a:is(:hover, :focus-visible) {
+		color: var(--fg-primary);
+	}
+
+	nav a::after {
+		content: '';
+		position: absolute;
+		left: 0;
+		right: 0;
+		bottom: -8px;
+		height: 3px;
+		border-radius: 10000px;
+	}
+
+	nav a.active::after {
+		background-color: var(--bg-primary);
+	}
+</style>
diff --git a/src/routes/(app)/protocols/[id]/metadata/[metadata]/infos/+page.svelte b/src/routes/(app)/protocols/[id]/metadata/[metadata]/infos/+page.svelte
new file mode 100644
index 0000000..e69de29
diff --git a/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/+layout.js b/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/+layout.js
new file mode 100644
index 0000000..e69de29
diff --git a/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/+layout.svelte b/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/+layout.svelte
new file mode 100644
index 0000000..acaeef6
--- /dev/null
+++ b/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/+layout.svelte
@@ -0,0 +1,149 @@
+<script>
+	import { goto } from '$app/navigation';
+	import { page } from '$app/state';
+	import ButtonIcon from '$lib/ButtonIcon.svelte';
+	import InlineTextInput from '$lib/InlineTextInput.svelte';
+	import { tables } from '$lib/idb.svelte.js';
+	import { removeNamespaceFromMetadataId } from '$lib/protocols.js';
+	import Fuse from 'fuse.js';
+	import slugify from 'slugify';
+	import IconSearch from '~icons/ph/magnifying-glass';
+	import IconClose from '~icons/ph/x';
+
+	const { data, children } = $props();
+	let options = $derived('options' in data.metadata ? data.metadata.options : []);
+
+	let q = $state('');
+
+	const searcher = $derived(new Fuse(options, { keys: ['label', 'key', 'description'] }));
+	let searchResults = $derived(q ? searcher.search(q).map((result) => result.item) : options);
+</script>
+
+<div class="aside-and-main">
+	<aside>
+		<div class="new-option">
+			<!-- <IconAdd /> -->
+			<InlineTextInput
+				discreet
+				label="Nom de la nouvelle option"
+				placeholder="Nouvelle option…"
+				value=""
+				onblur={async (label, setValue) => {
+					if (!label) return;
+					const newOption = {
+						label,
+						description: '',
+						key: slugify(label, { lower: true })
+					};
+					options = [newOption, ...options];
+					await tables.Metadata.update(data.metadata.id, 'options', $state.snapshot(options));
+					setValue('');
+					await goto(
+						`#/protocols/${data.protocol.id}/metadata/${removeNamespaceFromMetadataId(
+							data.metadata.id
+						)}/options/${newOption.key}`
+					);
+				}}
+			/>
+		</div>
+		<search>
+			<IconSearch />
+			<InlineTextInput
+				discreet
+				label="Rechercher une option"
+				placeholder="Rechercher…"
+				bind:value={q}
+				onblur={() => {}}
+			/>
+			<ButtonIcon --font-size="0.7em" onclick={() => (q = '')} help="Effacer la recherche">
+				<IconClose />
+			</ButtonIcon>
+		</search>
+		<nav>
+			{#each searchResults as { key, label } (key)}
+				<a
+					href="#/protocols/{data.protocol.id}/metadata/{removeNamespaceFromMetadataId(
+						data.metadata.id
+					)}/options/{key}"
+					class:active={page.url.hash.includes(`/options/${key}`)}
+				>
+					{label}
+				</a>
+			{/each}
+		</nav>
+	</aside>
+	<div class="content">
+		{@render children()}
+	</div>
+</div>
+
+<style>
+	.aside-and-main {
+		display: flex;
+		height: 100%;
+		overflow: hidden;
+	}
+
+	aside {
+		padding: 2rem;
+		border-right: 1px solid var(--gay);
+		overflow-y: scroll;
+	}
+
+	.content {
+		flex-grow: 1;
+		overflow: auto;
+		padding: 2rem;
+	}
+
+	nav {
+		display: flex;
+		flex-direction: column;
+		gap: 1rem;
+	}
+
+	search {
+		display: flex;
+		align-items: center;
+		gap: 0.25rem;
+		margin-bottom: 1rem;
+		border: 2px solid var(--gay);
+		border-radius: 0.5rem;
+		padding: 0.25rem 0.25rem;
+	}
+
+	.new-option {
+		display: flex;
+		align-items: center;
+		gap: 0.5rem;
+		margin-bottom: 1rem;
+	}
+
+	nav a {
+		display: flex;
+		align-items: center;
+		gap: 0.5rem;
+		color: var(--text);
+		text-decoration: none;
+		position: relative;
+		margin-left: 8px;
+	}
+
+	nav a:is(:hover, :focus-visible) {
+		color: var(--fg-primary);
+	}
+
+	nav a::after {
+		content: '';
+		position: absolute;
+		left: -8px;
+		top: 0;
+		bottom: 0;
+		width: 3px;
+		border-radius: 10000px;
+	}
+
+	nav a.active::after {
+		background-color: var(--bg-primary);
+	}
+</style>
diff --git a/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/+page.svelte b/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/+page.svelte
new file mode 100644
index 0000000..2e1fda5
--- /dev/null
+++ b/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/+page.svelte
@@ -0,0 +1,21 @@
+<script>
+	import Logo from '$lib/Logo.svelte';
+</script>
+
+<div class="empty">
+	<Logo --size="5rem" variant="empty" />
+	<p>Sélectionnez une option</p>
+</div>
+
+<style>
+	.empty {
+		display: flex;
+		flex-direction: column;
+		align-items: center;
+		justify-content: center;
+		height: 100%;
+		width: 100%;
+		flex-grow: 1;
+		gap: 1rem;
+	}
+</style>
diff --git a/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/[option]/+page.js b/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/[option]/+page.js
new file mode 100644
index 0000000..6aa68e4
--- /dev/null
+++ b/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/[option]/+page.js
@@ -0,0 +1,22 @@
+import { error } from '@sveltejs/kit';
+
+export async function load({ parent, params }) {
+	const { protocol, metadata } = await parent();
+	if (!('options' in metadata)) {
+		error(400, 'Metadata does not have options');
+	}
+
+	const option = metadata.options.find((o) => o.key === params.option);
+	if (!option) {
+		error(
+			404,
+			`Option ${params.option} not found in metadata ${metadata.id} of protocol ${protocol.id}`
+		);
+	}
+
+	return {
+		protocol,
+		metadata,
+		option
+	};
+}
diff --git a/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/[option]/+page.svelte b/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/[option]/+page.svelte
new file mode 100644
index 0000000..1bf5bcd
--- /dev/null
+++ b/src/routes/(app)/protocols/[id]/metadata/[metadata]/options/[option]/+page.svelte
@@ -0,0 +1,78 @@
+<script>
+	import { invalidateAll } from '$app/navigation';
+	import { tables } from '$lib/idb.svelte';
+	import InlineTextInput from '$lib/InlineTextInput.svelte';
+
+	const { data } = $props();
+	const { metadata, option } = $derived(data);
+
+	/**
+	 * @import { MetadataEnumVariant } from '$lib/schemas/metadata.js';
+	 * @param {Partial<typeof MetadataEnumVariant.infer>} newData
+	 */
+	async function updateOption(newData) {
+		await tables.Metadata.update(
+			metadata.id,
+			'options',
+			$state.snapshot(
+				metadata.options?.map((opt) => (opt.key === option.key ? { ...opt, ...newData } : opt))
+			)
+		);
+		await invalidateAll();
+		// TODO figure ts out 🥀
+		// await invalidate((url) => {
+		// 	console.log(`invalidate?`, url);
+		// 	return url.hash.startsWith(
+		// 		`#/protocols/${protocol.id}/metadata/${removeNamespaceFromMetadataId(metadata.id)}/options`
+		// 	);
+		// });
+	}
+</script>
+
+<div class="inputs">
+	<label>
+		<span class="label">Clé</span>
+		<InlineTextInput
+			value={option.key}
+			label="Clé de l'option"
+			discreet
+			onblur={async (newKey) => {
+				await updateOption({ key: newKey });
+			}}
+		/>
+	</label>
+
+	<label>
+		<span class="label">Label</span>
+		<InlineTextInput
+			value={option.label}
+			label="Label de l'option"
+			discreet
+			onblur={async (newLabel) => {
+				await updateOption({ label: newLabel });
+			}}
+		/>
+	</label>
+</div>
+
+<style>
+	.inputs {
+		display: flex;
+		flex-direction: column;
+		gap: 1rem;
+	}
+
+	label {
+		display: flex;
+		flex-direction: column;
+		font-size: 1.2rem;
+	}
+
+	.label {
+		font-weight: bold;
+		text-transform: uppercase;
+		letter-spacing: 2px;
+		font-size: 0.8em;
+		margin-bottom: 0.5rem;
+	}
+</style>
diff --git a/src/routes/(app)/protocols/[id]/versioning/+page.svelte b/src/routes/(app)/protocols/[id]/versioning/+page.svelte
new file mode 100644
index 0000000..e69de29
```