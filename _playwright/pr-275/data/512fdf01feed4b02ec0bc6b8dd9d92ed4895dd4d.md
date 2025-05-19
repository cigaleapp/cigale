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
diff --git a/.github/workflows/check.yml b/.github/workflows/check.yml
index 81f58c5..01bae01 100644
--- a/.github/workflows/check.yml
+++ b/.github/workflows/check.yml
@@ -21,7 +21,7 @@ jobs:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4
         with:
-          node-version: '22.15.0'
+          node-version: '22.15.1'
       - name: Install dependencies
         run: npm ci
       - name: Run tests
@@ -44,7 +44,7 @@ jobs:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4
         with:
-          node-version: '22.15.0'
+          node-version: '22.15.1'
       - name: Install dependencies
         run: npm ci
       - name: Run tests
diff --git a/.github/workflows/deploy.yml b/.github/workflows/deploy.yml
index 0f72fc6..f0bd18b 100644
--- a/.github/workflows/deploy.yml
+++ b/.github/workflows/deploy.yml
@@ -22,7 +22,7 @@ jobs:
       - name: Set up Node.js
         uses: actions/setup-node@v4
         with:
-          node-version: '22.15.0'
+          node-version: '22.15.1'
 
       - name: Install dependencies
         run: npm install
diff --git a/.github/workflows/regen-arthropods-protocol.yml b/.github/workflows/regen-arthropods-protocol.yml
index 304bd83..2b5e679 100644
--- a/.github/workflows/regen-arthropods-protocol.yml
+++ b/.github/workflows/regen-arthropods-protocol.yml
@@ -18,7 +18,7 @@ jobs:
       - name: Setup Node.js
         uses: actions/setup-node@v4
         with:
-          node-version: '22.15.0'
+          node-version: '22.15.1'
           cache: 'npm'
 
       - name: Install dependencies
diff --git a/package.json b/package.json
index 7da675c..ffa1bce 100644
--- a/package.json
+++ b/package.json
@@ -97,7 +97,7 @@
 		"yaml": "^2.7.1"
 	},
 	"volta": {
-		"node": "22.15.0",
+		"node": "22.15.1",
 		"npm": "11.3.0"
 	}
 }
```