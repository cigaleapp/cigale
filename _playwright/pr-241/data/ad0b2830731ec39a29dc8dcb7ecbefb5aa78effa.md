# Test info

- Name: Cropper view >> creating a new bounding box >> with 2-point tool >> should create boxes every 2 clicks
- Location: /home/runner/work/cigale/cigale/tests/cropper.spec.js:255:4

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
    - link "Importer":
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
    - term: Ctrl + U
    - definition: Supprimer toutes les images et observations
    - term: Ctrl + G
    - definition: Fusionner des observations ou images
    - term: Ctrl + Shift + G
    - definition: Séparer toutes les observations sélectionnées en images seules
    - term: Suppr
    - definition: Supprimer les images et observations sélectionnées
- main:
  - img
  - heading "Oops!" [level=2]
  - paragraph: Impossible de charger le modèle de recadrage
  - paragraph:
    - link "arthropod_detector_yolo11n_conf0.437.onnx":
      - /url: https://git.inpt.fr/cigale/cigale.pages.inpt.fr/-/tree/main/models/arthropod_detector_yolo11n_conf0.437.onnx
      - code: arthropod_detector_yolo11n_conf0.437.onnx
  - paragraph: "RuntimeError: Out of bounds memory access (evaluating 'On(...lr)')"
- text: Importer · Cigale
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
  127 | 			const { ...othersBefore } = await getSettings({ page });
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
diff --git a/examples/arthropods.cigaleprotocol.v2.json b/examples/arthropods.cigaleprotocol.v2.json
new file mode 100644
index 0000000..4855f96
--- /dev/null
+++ b/examples/arthropods.cigaleprotocol.v2.json
@@ -0,0 +1,1261 @@
+{
+	"$schema": "https://cigaleapp.github.io/cigale/protocol.schema.json",
+	"id": "io.github.cigaleapp.arthropods.example",
+	"version": 4,
+	"name": "Transect d'arthropodes (versionné!)",
+	"source": "http://localhost:8000/arthropods.cigaleprotocol.v2.json",
+	"description": "Protocole de transect pour l’identification des arthropodes. Descriptions et photos des espèces de Jessica Joachim, cf https://jessica-joachim.com/identification",
+	"authors": [
+		{
+			"name": "Jessica Joachim (photos et descriptions des espèces)",
+			"email": "tifaeriis@gmail.com"
+		}
+	],
+	"metadataOrder": [
+		"io.github.cigaleapp.arthropods.example__species",
+		"io.github.cigaleapp.arthropods.example__genus",
+		"io.github.cigaleapp.arthropods.example__family",
+		"io.github.cigaleapp.arthropods.example__order",
+		"io.github.cigaleapp.arthropods.example__shoot_date",
+		"io.github.cigaleapp.arthropods.example__shoot_location",
+		"io.github.cigaleapp.arthropods.example__class",
+		"io.github.cigaleapp.arthropods.example__phylum",
+		"io.github.cigaleapp.arthropods.example__kingdom",
+		"io.github.cigaleapp.arthropods.example__crop",
+		"io.github.cigaleapp.arthropods.example__crop_is_confirmed"
+	],
+	"metadata": {
+		"io.github.cigaleapp.arthropods.example__kingdom": {
+			"type": "enum",
+			"options": [
+				{
+					"key": "animalia",
+					"label": "Animalia",
+					"learnMore": "https://en.wikipedia.org/wiki/Animalia",
+					"description": ""
+				}
+			],
+			"label": "Règne",
+			"required": false,
+			"description": "",
+			"mergeMethod": "average",
+			"taxonomic": {
+				"clade": "kingdom",
+				"parent": {}
+			}
+		},
+		"io.github.cigaleapp.arthropods.example__phylum": {
+			"type": "enum",
+			"options": [
+				{
+					"key": "arthropoda",
+					"label": "Arthropoda",
+					"learnMore": "https://en.wikipedia.org/wiki/Arthropoda",
+					"description": ""
+				}
+			],
+			"label": "Phylum",
+			"required": false,
+			"description": "",
+			"mergeMethod": "average",
+			"taxonomic": {
+				"clade": "phylum",
+				"parent": {
+					"arthropoda": "animalia"
+				}
+			}
+		},
+		"io.github.cigaleapp.arthropods.example__class": {
+			"type": "enum",
+			"options": [
+				{
+					"key": "collembola",
+					"label": "Collembola",
+					"learnMore": "https://en.wikipedia.org/wiki/Collembola",
+					"description": ""
+				}
+			],
+			"label": "Classe",
+			"required": false,
+			"description": "",
+			"mergeMethod": "average",
+			"taxonomic": {
+				"clade": "class",
+				"parent": {
+					"collembola": "arthropoda"
+				}
+			}
+		},
+		"io.github.cigaleapp.arthropods.example__order": {
+			"type": "enum",
+			"options": [
+				{
+					"key": "symphypleona",
+					"label": "Symphypleona",
+					"learnMore": "https://en.wikipedia.org/wiki/Symphypleona",
+					"description": ""
+				},
+				{
+					"key": "poduromorpha",
+					"label": "Poduromorpha",
+					"learnMore": "https://en.wikipedia.org/wiki/Poduromorpha",
+					"description": ""
+				},
+				{
+					"key": "entomobryomorpha",
+					"label": "Entomobryomorpha",
+					"learnMore": "https://en.wikipedia.org/wiki/Entomobryomorpha",
+					"description": ""
+				},
+				{
+					"key": "neelipleona",
+					"label": "Neelipleona",
+					"learnMore": "https://en.wikipedia.org/wiki/Neelipleona",
+					"description": ""
+				}
+			],
+			"label": "Ordre",
+			"required": false,
+			"description": "",
+			"mergeMethod": "average",
+			"taxonomic": {
+				"clade": "order",
+				"parent": {
+					"symphypleona": "collembola",
+					"poduromorpha": "collembola",
+					"entomobryomorpha": "collembola",
+					"neelipleona": "collembola"
+				}
+			}
+		},
+		"io.github.cigaleapp.arthropods.example__family": {
+			"type": "enum",
+			"options": [
+				{
+					"key": "sminthuridae",
+					"label": "Sminthuridae",
+					"learnMore": "https://en.wikipedia.org/wiki/Sminthuridae",
+					"description": ""
+				},
+				{
+					"key": "neanuridae",
+					"label": "Neanuridae",
+					"learnMore": "https://en.wikipedia.org/wiki/Neanuridae",
+					"description": ""
+				},
+				{
+					"key": "bourletiellidae",
+					"label": "Bourletiellidae",
+					"learnMore": "https://en.wikipedia.org/wiki/Bourletiellidae",
+					"description": ""
+				},
+				{
+					"key": "brachystomellidae",
+					"label": "Brachystomellidae",
+					"learnMore": "https://en.wikipedia.org/wiki/Brachystomellidae",
+					"description": ""
+				},
+				{
+					"key": "hypogastruridae",
+					"label": "Hypogastruridae",
+					"learnMore": "https://en.wikipedia.org/wiki/Hypogastruridae",
+					"description": ""
+				},
+				{
+					"key": "paronellidae",
+					"label": "Paronellidae",
+					"learnMore": "https://en.wikipedia.org/wiki/Paronellidae",
+					"description": ""
+				},
+				{
+					"key": "dicyrtomidae",
+					"label": "Dicyrtomidae",
+					"learnMore": "https://en.wikipedia.org/wiki/Dicyrtomidae",
+					"description": ""
+				},
+				{
+					"key": "entomobryidae",
+					"label": "Entomobryidae",
+					"learnMore": "https://en.wikipedia.org/wiki/Entomobryidae",
+					"description": ""
+				},
+				{
+					"key": "isotomidae",
+					"label": "Isotomidae",
+					"learnMore": "https://en.wikipedia.org/wiki/Isotomidae",
+					"description": ""
+				},
+				{
+					"key": "orchesellidae",
+					"label": "Orchesellidae",
+					"learnMore": "https://en.wikipedia.org/wiki/Orchesellidae",
+					"description": ""
+				},
+				{
+					"key": "onychiuridae",
+					"label": "Onychiuridae",
+					"learnMore": "https://en.wikipedia.org/wiki/Onychiuridae",
+					"description": ""
+				},
+				{
+					"key": "neelidae",
+					"label": "Neelidae",
+					"learnMore": "https://en.wikipedia.org/wiki/Neelidae",
+					"description": ""
+				},
+				{
+					"key": "poduridae",
+					"label": "Poduridae",
+					"learnMore": "https://en.wikipedia.org/wiki/Poduridae",
+					"description": ""
+				},
+				{
+					"key": "tomoceridae",
+					"label": "Tomoceridae",
+					"learnMore": "https://en.wikipedia.org/wiki/Tomoceridae",
+					"description": ""
+				},
+				{
+					"key": "sminthurididae",
+					"label": "Sminthurididae",
+					"learnMore": "https://en.wikipedia.org/wiki/Sminthurididae",
+					"description": ""
+				},
+				{
+					"key": "katiannidae",
+					"label": "Katiannidae",
+					"learnMore": "https://en.wikipedia.org/wiki/Katiannidae",
+					"description": ""
+				}
+			],
+			"label": "Famille",
+			"required": false,
+			"description": "",
+			"mergeMethod": "average",
+			"taxonomic": {
+				"clade": "family",
+				"parent": {
+					"sminthuridae": "symphypleona",
+					"neanuridae": "poduromorpha",
+					"bourletiellidae": "symphypleona",
+					"brachystomellidae": "poduromorpha",
+					"hypogastruridae": "poduromorpha",
+					"paronellidae": "entomobryomorpha",
+					"dicyrtomidae": "symphypleona",
+					"entomobryidae": "entomobryomorpha",
+					"isotomidae": "entomobryomorpha",
+					"orchesellidae": "entomobryomorpha",
+					"onychiuridae": "poduromorpha",
+					"neelidae": "neelipleona",
+					"poduridae": "poduromorpha",
+					"tomoceridae": "entomobryomorpha",
+					"sminthurididae": "symphypleona",
+					"katiannidae": "symphypleona"
+				}
+			}
+		},
+		"io.github.cigaleapp.arthropods.example__genus": {
+			"type": "enum",
+			"options": [
+				{
+					"key": "allacma",
+					"label": "Allacma",
+					"learnMore": "https://en.wikipedia.org/wiki/Allacma",
+					"description": ""
+				},
+				{
+					"key": "anurida",
+					"label": "Anurida",
+					"learnMore": "https://en.wikipedia.org/wiki/Anurida",
+					"description": ""
+				},
+				{
+					"key": "bilobella",
+					"label": "Bilobella",
+					"learnMore": "https://en.wikipedia.org/wiki/Bilobella",
+					"description": ""
+				},
+				{
+					"key": "bourletiella",
+					"label": "Bourletiella",
+					"learnMore": "https://en.wikipedia.org/wiki/Bourletiella",
+					"description": ""
+				},
+				{
+					"key": "brachystomella",
+					"label": "Brachystomella",
+					"learnMore": "https://en.wikipedia.org/wiki/Brachystomella",
+					"description": ""
+				},
+				{
+					"key": "caprainea",
+					"label": "Caprainea",
+					"learnMore": "https://en.wikipedia.org/wiki/Caprainea",
+					"description": ""
+				},
+				{
+					"key": "ceratophysella",
+					"label": "Ceratophysella",
+					"learnMore": "https://en.wikipedia.org/wiki/Ceratophysella",
+					"description": ""
+				},
+				{
+					"key": "cyphoderus",
+					"label": "Cyphoderus",
+					"learnMore": "https://en.wikipedia.org/wiki/Cyphoderus",
+					"description": ""
+				},
+				{
+					"key": "deuterosminthurus",
+					"label": "Deuterosminthurus",
+					"learnMore": "https://en.wikipedia.org/wiki/Deuterosminthurus",
+					"description": ""
+				},
+				{
+					"key": "dicyrtoma",
+					"label": "Dicyrtoma",
+					"learnMore": "https://en.wikipedia.org/wiki/Dicyrtoma",
+					"description": ""
+				},
+				{
+					"key": "dicyrtomina",
+					"label": "Dicyrtomina",
+					"learnMore": "https://en.wikipedia.org/wiki/Dicyrtomina",
+					"description": ""
+				},
+				{
+					"key": "entomobrya",
+					"label": "Entomobrya",
+					"learnMore": "https://en.wikipedia.org/wiki/Entomobrya",
+					"description": ""
+				},
+				{
+					"key": "fasciosminthurus",
+					"label": "Fasciosminthurus",
+					"learnMore": "https://en.wikipedia.org/wiki/Fasciosminthurus",
+					"description": ""
+				},
+				{
+					"key": "folsomia",
+					"label": "Folsomia",
+					"learnMore": "https://en.wikipedia.org/wiki/Folsomia",
+					"description": ""
+				},
+				{
+					"key": "heteromurus",
+					"label": "Heteromurus",
+					"learnMore": "https://en.wikipedia.org/wiki/Heteromurus",
+					"description": ""
+				},
+				{
+					"key": "hypogastrura",
+					"label": "Hypogastrura",
+					"learnMore": "https://en.wikipedia.org/wiki/Hypogastrura",
+					"description": ""
+				},
+				{
+					"key": "isotoma",
+					"label": "Isotoma",
+					"learnMore": "https://en.wikipedia.org/wiki/Isotoma",
+					"description": ""
+				},
+				{
+					"key": "isotomiella",
+					"label": "Isotomiella",
+					"learnMore": "https://en.wikipedia.org/wiki/Isotomiella",
+					"description": ""
+				},
+				{
+					"key": "isotomurus",
+					"label": "Isotomurus",
+					"learnMore": "https://en.wikipedia.org/wiki/Isotomurus",
+					"description": ""
+				},
+				{
+					"key": "kalaphorura",
+					"label": "Kalaphorura",
+					"learnMore": "https://en.wikipedia.org/wiki/Kalaphorura",
+					"description": ""
+				},
+				{
+					"key": "lepidocyrtus",
+					"label": "Lepidocyrtus",
+					"learnMore": "https://en.wikipedia.org/wiki/Lepidocyrtus",
+					"description": ""
+				},
+				{
+					"key": "megalothorax",
+					"label": "Megalothorax",
+					"learnMore": "https://en.wikipedia.org/wiki/Megalothorax",
+					"description": ""
+				},
+				{
+					"key": "monobella",
+					"label": "Monobella",
+					"learnMore": "https://en.wikipedia.org/wiki/Monobella",
+					"description": ""
+				},
+				{
+					"key": "neanura",
+					"label": "Neanura",
+					"learnMore": "https://en.wikipedia.org/wiki/Neanura",
+					"description": ""
+				},
+				{
+					"key": "neelus",
+					"label": "Neelus",
+					"learnMore": "https://en.wikipedia.org/wiki/Neelus",
+					"description": ""
+				},
+				{
+					"key": "orchesella",
+					"label": "Orchesella",
+					"learnMore": "https://en.wikipedia.org/wiki/Orchesella",
+					"description": ""
+				},
+				{
+					"key": "parisotoma",
+					"label": "Parisotoma",
+					"learnMore": "https://en.wikipedia.org/wiki/Parisotoma",
+					"description": ""
+				},
+				{
+					"key": "podura",
+					"label": "Podura",
+					"learnMore": "https://en.wikipedia.org/wiki/Podura",
+					"description": ""
+				},
+				{
+					"key": "pogonognathellus",
+					"label": "Pogonognathellus",
+					"learnMore": "https://en.wikipedia.org/wiki/Pogonognathellus",
+					"description": ""
+				},
+				{
+					"key": "seira",
+					"label": "Seira",
+					"learnMore": "https://en.wikipedia.org/wiki/Seira",
+					"description": ""
+				},
+				{
+					"key": "sminthurides",
+					"label": "Sminthurides",
+					"learnMore": "https://en.wikipedia.org/wiki/Sminthurides",
+					"description": ""
+				},
+				{
+					"key": "sminthurinus",
+					"label": "Sminthurinus",
+					"learnMore": "https://en.wikipedia.org/wiki/Sminthurinus",
+					"description": ""
+				},
+				{
+					"key": "tomocerus",
+					"label": "Tomocerus",
+					"learnMore": "https://en.wikipedia.org/wiki/Tomocerus",
+					"description": ""
+				},
+				{
+					"key": "vertagopus",
+					"label": "Vertagopus",
+					"learnMore": "https://en.wikipedia.org/wiki/Vertagopus",
+					"description": ""
+				},
+				{
+					"key": "vitronura",
+					"label": "Vitronura",
+					"learnMore": "https://en.wikipedia.org/wiki/Vitronura",
+					"description": ""
+				},
+				{
+					"key": "willowsia",
+					"label": "Willowsia",
+					"learnMore": "https://en.wikipedia.org/wiki/Willowsia",
+					"description": ""
+				}
+			],
+			"label": "Genre",
+			"required": false,
+			"description": "",
+			"mergeMethod": "average",
+			"taxonomic": {
+				"clade": "genus",
+				"parent": {
+					"allacma": "sminthuridae",
+					"anurida": "neanuridae",
+					"bilobella": "neanuridae",
+					"bourletiella": "bourletiellidae",
+					"brachystomella": "brachystomellidae",
+					"caprainea": "sminthuridae",
+					"ceratophysella": "hypogastruridae",
+					"cyphoderus": "paronellidae",
+					"deuterosminthurus": "bourletiellidae",
+					"dicyrtoma": "dicyrtomidae",
+					"dicyrtomina": "dicyrtomidae",
+					"entomobrya": "entomobryidae",
+					"fasciosminthurus": "bourletiellidae",
+					"folsomia": "isotomidae",
+					"heteromurus": "orchesellidae",
+					"hypogastrura": "hypogastruridae",
+					"isotoma": "isotomidae",
+					"isotomiella": "isotomidae",
+					"isotomurus": "isotomidae",
+					"kalaphorura": "onychiuridae",
+					"lepidocyrtus": "entomobryidae",
+					"megalothorax": "neelidae",
+					"monobella": "neanuridae",
+					"neanura": "neanuridae",
+					"neelus": "neelidae",
+					"orchesella": "orchesellidae",
+					"parisotoma": "isotomidae",
+					"podura": "poduridae",
+					"pogonognathellus": "tomoceridae",
+					"seira": "entomobryidae",
+					"sminthurides": "sminthurididae",
+					"sminthurinus": "katiannidae",
+					"tomocerus": "tomoceridae",
+					"vertagopus": "isotomidae",
+					"vitronura": "neanuridae",
+					"willowsia": "entomobryidae"
+				}
+			}
+		},
+		"io.github.cigaleapp.arthropods.example__shoot_date": {
+			"type": "date",
+			"label": "Date",
+			"description": "Moment où la photo a été prise",
+			"required": false,
+			"mergeMethod": "average",
+			"infer": {
+				"exif": "DateTimeOriginal"
+			}
+		},
+		"io.github.cigaleapp.arthropods.example__shoot_location": {
+			"type": "location",
+			"label": "Localisation",
+			"description": "Endroit où la photo a été prise",
+			"required": false,
+			"mergeMethod": "average",
+			"infer": {
+				"latitude": {
+					"exif": "GPSLatitude"
+				},
+				"longitude": {
+					"exif": "GPSLongitude"
+				}
+			}
+		},
+		"io.github.cigaleapp.arthropods.example__crop": {
+			"type": "boundingbox",
+			"label": "",
+			"description": "",
+			"required": true,
+			"mergeMethod": "average"
+		},
+		"io.github.cigaleapp.arthropods.example__crop_is_confirmed": {
+			"type": "boolean",
+			"label": "",
+			"description": "",
+			"required": false,
+			"mergeMethod": "max"
+		},
+		"io.github.cigaleapp.arthropods.example__species": {
+			"type": "enum",
+			"label": "Espèce",
+			"description": "",
+			"required": true,
+			"mergeMethod": "max",
+			"options": [
+				{
+					"key": "0",
+					"label": "Allacma fusca",
+					"description": "Allacma fusca est de couleur brun foncé avec des marques brun plus clair sur l’abdomen. L’abdomen possède de grandes soies sur toute sa surface. Le 4ème article antennaire est plus long que le 3ème, ce dernier possédant de longues soies.La variante",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/sminthuridae/allacma-fusca/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Allacma%20fusca.jpeg"
+				},
+				{
+					"key": "1",
+					"label": "Anurida maritima",
+					"description": ""
+				},
+				{
+					"key": "2",
+					"label": "Bilobella aurantiaca",
+					"description": "Bilobella aurantiaca est de couleur jaune citron, d’aspect boudiné avec de petites excroissances rondes sur les segments. Le 6ème segment abdominal est bilobé, le bout des antennes est blanc et les deux ocelles orangés.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/neanuridae/bilobella-aurantiaca/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Bilobella%20aurantiaca.jpeg"
+				},
+				{
+					"key": "3",
+					"label": "Bilobella braunerae",
+					"description": ""
+				},
+				{
+					"key": "4",
+					"label": "Bourletiella arvalis",
+					"description": "Bourletiella arvalis est un collembole au corps rond et de couleur jaune vif. Les poils de l’abdomen sont assez courts.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/bourletiellidae/bourletiella-arvalis/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Bourletiella%20arvalis.jpeg"
+				},
+				{
+					"key": "5",
+					"label": "Bourletiella hortensis",
+					"description": "Bourletiella hortensis peut être de couleur jaune à orangé plus ou moins maculé de pâle (forme albomaculata), brunâtre plus ou moins foncé à violacé. Il possède une longue soie sur abd 5, les soies de l’abdomen sont assez courtes et denses.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/bourletiellidae/bourletiella-hortensis/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Bourletiella%20hortensis.jpeg"
+				},
+				{
+					"key": "6",
+					"label": "Brachystomella parvula",
+					"description": "Brachystomella parvula est un collembole au corps ovale, légèrement élargi en arrière. Il est de couleur violacée à rose. Ses antennes sont courtes. Il possède 8 ocelles. Il n’a pas d’épines anales.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/brachystomellidae/brachystomella-parvula/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Brachystomella%20parvula.jpeg"
+				},
+				{
+					"key": "7",
+					"label": "Caprainea marginata",
+					"description": "Caprainea marginata a un corps globuleux avec de longues soies droites et épaisses sur tout l’abdomen. Le 4ème segment antennaire est long. Elle peut-être de différentes couleurs selon les formes.\r\n•",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/sminthuridae/caprainea-marginata/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Caprainea%20marginata.jpeg"
+				},
+				{
+					"key": "8",
+					"label": "Ceratophysella denticulata",
+					"description": "• corps allongé\r\n• courtes antennes\r\n• coloration variable, rose, gris bleu ou violet plus ou moins foncé\r\n• 8 ocelles\r\n• corps recouvert de soies de deux types (« microsetae » et « macrosetae »)\r\n• 2 épines anales longues et recourbées (sauf chez l’espèce C. bengtssoni)\nPour identifier les espèces, il faut regarder les soies sur le corps du collembole. Pour cela, il faut une bonne vue dorsale de l’animal.Les soies à examiner dans un premiers temps sont celle de la rangée apicale du 4ème segment abdominal. On peut diviser le genre en deux groupes : le groupe denticulata, chez qui p1<p2. Le « p » signifie « postérieure », en référence à la rangée de soie concernée (généralement, il y a une rangée antérieure, une rangée médiane puis une rangée postérieure par segment). Le chiffre correspond au numéro de la soie, comptée à partir d’une ligne imaginaire coupant le segment abdominal en son milieu. Donc p1 est la soie de la rangée postérieure la plus proche du centre du segment. Chez le **groupe _armata_**, p1>p2. Une fois que l’on a le groupe, il reste d’autres critères à observer (comme par exemple la présence et le nombre d’autres soies), mais je n’ai pas trouvé de clé précise, et ne sait pas à quel groupe appartiennent toutes les espèces notées de France. Et puis cela reste des critères très difficiles à utiliser pour une identification photo.A noter qu’il y a une espèce dans ce genre qui se distingue des autres par ses épines anales courtes : Ceratophysella bengtssoni.Sur collembola.org, Ceratophysella succinea est de coloration jaune à jaunâtre, ce qui semble rare dans ce genre.Ceratophysella granulata se reconnaitrait grâce à la granulation des derniers segments abdominaux : granulation grossière sur abd 6, sur abd 5 granulation grossière sauf une bande de granulation plus fine à la base du segment, 3 zones de granulation grossière sur abd4 (voir ici). Cependant, Ceratophysella denticulata a visiblement une granulation similaire. Ce dernier fait partie du groupe denticulata (p1<p2) alors que _Ceratophysella granulata_ fait partie du groupe _armata_ (p1>p2).\nIl s’agit d’un des genres les plus fournis en espèces de la famille des Hypogastruridae, avec au moins 130 espèces dans le monde\nListe des espèces présentes en France d’après la Catalogue des collemboles de France\n\r\n• Ceratophysella armata\r\n• Ceratophysella bengtssoni : la seule espèce du genre à avoir des épines anales courtes\r\n• Ceratophysella cavicola (espèce cavernicole)\r\n• Ceratophysella cylindrica (trouvé uniquement dans les Hautes-Pyrénées)\r\n• Ceratophysella denticulata\r\n• Ceratophysella engadinensis\r\n• Ceratophysella falcifer (noté uniquement du pic de Néouvielle, Hautes-Pyrénées)\r\n• Ceratophysella gibbosa (noté de Paris uniquement)\r\n• Ceratophysella granulata\r\n• Ceratophysella longispina\r\n• Ceratophysella luteospina\r\n• Ceratophysella norensis\r\n• Ceratophysella penicillifer\r\n• Ceratophysella recta (noté des Hautes-Pyrénées uniquement)\r\n• Ceratophysella sigillata\r\n• Ceratophysella succinea (noté uniquement du Morbihan) : a une coloration jaune/jaunâtre\r\n• Ceratophysella tergilobata (trouvé en Corse)\r\n• Ceratophysella tuberculata",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/hypogastruridae/ceratophysella-sp/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Ceratophysella%20denticulata.jpeg"
+				},
+				{
+					"key": "9",
+					"label": "Ceratophysella longispina",
+					"description": "• corps allongé\r\n• courtes antennes\r\n• coloration variable, rose, gris bleu ou violet plus ou moins foncé\r\n• 8 ocelles\r\n• corps recouvert de soies de deux types (« microsetae » et « macrosetae »)\r\n• 2 épines anales longues et recourbées (sauf chez l’espèce C. bengtssoni)\nPour identifier les espèces, il faut regarder les soies sur le corps du collembole. Pour cela, il faut une bonne vue dorsale de l’animal.Les soies à examiner dans un premiers temps sont celle de la rangée apicale du 4ème segment abdominal. On peut diviser le genre en deux groupes : le groupe denticulata, chez qui p1<p2. Le « p » signifie « postérieure », en référence à la rangée de soie concernée (généralement, il y a une rangée antérieure, une rangée médiane puis une rangée postérieure par segment). Le chiffre correspond au numéro de la soie, comptée à partir d’une ligne imaginaire coupant le segment abdominal en son milieu. Donc p1 est la soie de la rangée postérieure la plus proche du centre du segment. Chez le **groupe _armata_**, p1>p2. Une fois que l’on a le groupe, il reste d’autres critères à observer (comme par exemple la présence et le nombre d’autres soies), mais je n’ai pas trouvé de clé précise, et ne sait pas à quel groupe appartiennent toutes les espèces notées de France. Et puis cela reste des critères très difficiles à utiliser pour une identification photo.A noter qu’il y a une espèce dans ce genre qui se distingue des autres par ses épines anales courtes : Ceratophysella bengtssoni.Sur collembola.org, Ceratophysella succinea est de coloration jaune à jaunâtre, ce qui semble rare dans ce genre.Ceratophysella granulata se reconnaitrait grâce à la granulation des derniers segments abdominaux : granulation grossière sur abd 6, sur abd 5 granulation grossière sauf une bande de granulation plus fine à la base du segment, 3 zones de granulation grossière sur abd4 (voir ici). Cependant, Ceratophysella denticulata a visiblement une granulation similaire. Ce dernier fait partie du groupe denticulata (p1<p2) alors que _Ceratophysella granulata_ fait partie du groupe _armata_ (p1>p2).\nIl s’agit d’un des genres les plus fournis en espèces de la famille des Hypogastruridae, avec au moins 130 espèces dans le monde\nListe des espèces présentes en France d’après la Catalogue des collemboles de France\n\r\n• Ceratophysella armata\r\n• Ceratophysella bengtssoni : la seule espèce du genre à avoir des épines anales courtes\r\n• Ceratophysella cavicola (espèce cavernicole)\r\n• Ceratophysella cylindrica (trouvé uniquement dans les Hautes-Pyrénées)\r\n• Ceratophysella denticulata\r\n• Ceratophysella engadinensis\r\n• Ceratophysella falcifer (noté uniquement du pic de Néouvielle, Hautes-Pyrénées)\r\n• Ceratophysella gibbosa (noté de Paris uniquement)\r\n• Ceratophysella granulata\r\n• Ceratophysella longispina\r\n• Ceratophysella luteospina\r\n• Ceratophysella norensis\r\n• Ceratophysella penicillifer\r\n• Ceratophysella recta (noté des Hautes-Pyrénées uniquement)\r\n• Ceratophysella sigillata\r\n• Ceratophysella succinea (noté uniquement du Morbihan) : a une coloration jaune/jaunâtre\r\n• Ceratophysella tergilobata (trouvé en Corse)\r\n• Ceratophysella tuberculata",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/hypogastruridae/ceratophysella-sp/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Ceratophysella%20longispina.jpeg"
+				},
+				{
+					"key": "10",
+					"label": "Cyphoderus albinus",
+					"description": "Ce genre comprend de petits collemboles blanchâtres ne possédant pas d’yeux. Leur corps est court et ovale, très peu poilu, les antennes assez courtes avec le 3ème article en forme de goutte. L’espèce la plus courante est C.albinus.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/cyphoderus-sp/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Cyphoderus%20albinus.jpeg"
+				},
+				{
+					"key": "11",
+					"label": "Deuterosminthurus bicinctus",
+					"description": ""
+				},
+				{
+					"key": "12",
+					"label": "Deuterosminthurus pallipes",
+					"description": "Deuterosminthurus pallipes est un collembole au corps assez allongé et qui a plusieurs formes de couleur. Une",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/bourletiellidae/deuterosminthurus-pallipes/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Deuterosminthurus%20pallipes.jpeg"
+				},
+				{
+					"key": "13",
+					"label": "Dicyrtoma fusca",
+					"description": "Dicyrtoma fusca est un collembole au corps globuleux avec de longues soies à l’arrière de l’abdomen. Le 4ème segment antennaire est très court. Sa tête est assez grande, avec de grosses joues. Les griffes ne possèdent pas de tunique.\nIl existe plusieurs formes :\r\n• D. fusca forme signata possède des teintes jaunes sur les flancs et le dessus du corps, combinées à une ligne dorsale et des dessins plus sombre (souvent violacés) d’étendue variable. Les yeux sont noirs. C’est peut être une écomorphose d’hiver.\r\n• D. fusca var. rufescens est de couleur assez uniforme, mauve, orangée ou rougeâtre. Les yeux sont jaunes à ocelles noirs. Les segments antennaires 3 et 4 sont souvent plus sombres que les 1 et 2.\r\n• D. fusca var.2 a le segment antennaire 4 et l’apex du 3 blancs, la pointe des pattes blanche et une ligne dorsale pâle. La couleur du corps est souvent brun sombre. Les yeux sont noirs.\r\n• Une autre forme existe, avec un nom étrange : Papirius fusco. Cette forme est de coloration assez uniforme, souvent violacée, avec la ligne dorsale peu visible. Les yeux sont noirs. Il s’agit peut-être en réalité de la forme nominale.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/dicyrtomidae/dicyrtoma-fusca/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Dicyrtoma%20fusca.jpeg"
+				},
+				{
+					"key": "14",
+					"label": "Dicyrtomina flavosignata",
+					"description": "Dicyrtomina flavosignata est de couleur jaune orangé. Elle possède des lignes pouvant être en pointillé sur les côtés de l’abdomen, ainsi que deux petites taches sombres en arrière de ces lignes. L’arrière de l’abdomen ne porte pas de tache sombre.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/dicyrtomidae/dicyrtomina-flavosignata/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Dicyrtomina%20flavosignata.jpeg"
+				},
+				{
+					"key": "15",
+					"label": "Dicyrtomina minuta",
+					"description": "Dicyrtomina minuta est de couleur jaune plus ou moins vif, avec quelques marques rougeâtres et jaune plus lumineux sur les flancs. Le dos est dépourvu de marques. L’arrière de l’abdomen présente une tache rectangulaire ornée de deux séries de petits points pâles. Parfois, les points sont plus gros et la tache plus étroite, ce qui donne une impression de petite barre d’antenne.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/dicyrtomidae/dicyrtomina-minuta/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Dicyrtomina%20minuta.jpeg"
+				},
+				{
+					"key": "16",
+					"label": "Dicyrtomina ornata",
+					"description": "• corps globuleux à longues soies à l’arrière\r\n• ligne dorsale claire\r\n• coloration variable, jaune, rougeâtre, mauve\r\n• nombreuses taches irrégulières sur le corps, y compris à proximité immédiate de la ligne dorsale\r\n• antennes de coloration uniforme\r\n• 4ème segment antennaire très court\r\n• plus de 2 soies alignées verticalement sur la face\r\n• bande sombre sur la face, entre les yeux\r\n• yeux composés de 8 ocelles\r\n• tache de forme variable à l’arrière de l’abdomen (elle peut être rectangulaire, plus ou moins étroite, assez allongée, avec ou sans lignes horizontales ; si ces lignes sont présentes, elles sont de même longueur)",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/dicyrtomidae/dicyrtomina-ornata/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Dicyrtomina%20ornata.jpeg"
+				},
+				{
+					"key": "17",
+					"label": "Dicyrtomina saundersi",
+					"description": "Dicyrtomina saundersi possède une ligne dorsale en forme de croix à bande transversale épaisse, un dessin en forme d’antenne (alignement de barres) sur le derrière, les articles antennaires 1 et 2 sont un peu plus clairs que les articles 3 et 4 (souvent le deuxième est encore plus clair à l’apex). Il possède de longs poils à l’arrière de l’abdomen, plus de 2 soies alignées en hauteur sur la face, le 4ème article antennaire est bien plus petit que le 3ème.La forme meridionalis a les antennes de couleur uniforme et la tache en antenne possède de grandes barres régulières. De part et d’autre du haut de cette tache, se retrouve souvent deux dessins en forme de L clair inversé.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/dicyrtomidae/dicyrtomina-saundersi/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Dicyrtomina%20saundersi.jpeg"
+				},
+				{
+					"key": "18",
+					"label": "Dicyrtomina signata",
+					"description": "Dicyrtomina signata est de couleur générale jaune, avec des marques oranges sur les côtés du corps et parfois aussi sur le dos. La tache à l’arrière de l’abdomen est un spot rond, situé en bas.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/dicyrtomidae/dicyrtomina-signata/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Dicyrtomina%20signata.jpeg"
+				},
+				{
+					"key": "19",
+					"label": "Entomobrya albocincta",
+					"description": "Entomobrya albocincta a une coloration typique qui permet de la reconnaitre au premier coup d’œil, chose rare chez les collemboles. Son corps est sombre, avec une bande claire thoracique, la première moitié du 4ème segment abdominal claire et l’apex de l’abdomen clair. Les antennes sont plus claires à la base.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/entomobrya-albocincta/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Entomobrya%20albocincta.jpeg"
+				},
+				{
+					"key": "20",
+					"label": "Entomobrya atrocincta",
+					"description": ""
+				},
+				{
+					"key": "21",
+					"label": "Entomobrya corticalis",
+					"description": ""
+				},
+				{
+					"key": "22",
+					"label": "Entomobrya marginata",
+					"description": "• corps de couleur verdâtre\r\n• apex des segments thoraciques et abdominaux à bande sombre\r\n• 4ème segment abdominal allongé\r\n• bande sombre entre les antennes",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/entomobrya-marginata/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Entomobrya%20marginata.jpeg"
+				},
+				{
+					"key": "23",
+					"label": "Entomobrya multifasciata",
+					"description": "Entomobrya multifasciata a un corps allongé de couleur jaunâtre. Il est rayé, les segments thoraciques et le premier segment abdominal (abd1) ont une bande sombre à l’apex. Abd2 et abd3 ont aussi une bande sombre à l’apex, avec en plus deux triangles sur les côtés remontant vers l’avant. Abd4 possède deux taches latérales sombres et deux triangles sombres remontant vers l’avant, le tout pouvant être relié, et également une bande antémédiane en zigzag, pouvant être reliée aux deux taches triangulaires du même segment. Abd5 présente une bande sombre continue à l’apex. Il possède un bandeau sombre reliant les yeux et se prolongeant en arrière de ceux-ci et sur le reste du corps.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/entomobrya-multifasciata/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Entomobrya%20multifasciata.jpeg"
+				},
+				{
+					"key": "24",
+					"label": "Entomobrya muscorum",
+					"description": "Entomobrya muscorum a de longues antennes et le 4ème segment abdominal plus grand que le 3ème. Son corps est densément velu, ses yeux traversés par une ligne sombre. Elle possède sur le dos deux lignes longitudinales. Certains individus peuvent être plus sombres, notamment sur les premiers et le 4ème segment abdominal, avec une ceinture blanche sur le 3ème segment.La forme classique a une grosse taches centrale sombre sur le dernier segment abdominal.La forme postbimaculata possède deux taches sombres latérales sur le dernier segment abdominal.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/entomobrya-muscorum/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Entomobrya%20muscorum.jpeg"
+				},
+				{
+					"key": "25",
+					"label": "Entomobrya nicoleti",
+					"description": "Entomobrya nicoleti est de couleur jaunâtre pale. Il possède un bandeau sombre reliant les yeux et une bande sombre plus ou moins visible sur les bords inférieur du thorax. Les segments abdominaux 2 et 3 possèdent parfois des taches latérales brun mauve pâle. Le 4ème segment abdominal, allongé, présente deux taches sombres sur chacun de ses côtés au niveau de l’apex. Il peut aussi y avoir une tache latérale centrale plus pâle, reliée aux taches de l’apex par une bande brun mauve pâle. L’apex du segment 5 est bordé de sombre. Les antennes sont longues et le 2ème article n’est pas subdivisé.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/entomobrya-nicoleti/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Entomobrya%20nicoleti.jpeg"
+				},
+				{
+					"key": "26",
+					"label": "Entomobrya nigrocincta",
+					"description": "Entomobrya nigrocincta présente un dimorphisme sexuel marqué.Le mâle a le corps clair avec le 2ème segment thoracique et le 1er abdominal sombres, le reste des segments sans ligne sombre. Les jeunes mâles n’ont pas la bande sombre thoracique et sont entièrement jaune orangés.La femelle est pâle avec de nettes bandes sombres à la marge postérieure des tergites, un bandeau facial sombre, une bande transversale sombre et dentée au centre du 4ème segment abdominal, l’apex du 5ème segment abdominal présente deux taches rondes latérales qui ne sont pas nettement reliées entre elles.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/entomobrya-nigrocincta/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Entomobrya%20nigrocincta.jpeg"
+				},
+				{
+					"key": "27",
+					"label": "Entomobrya nivalis",
+					"description": ""
+				},
+				{
+					"key": "28",
+					"label": "Entomobrya superba",
+					"description": ""
+				},
+				{
+					"key": "29",
+					"label": "Fasciosminthurus quinquefasciatus",
+					"description": "Fasciosminthurus quinquefasciatus se reconnait facilement à sa couleur brune pus ou moins claire rayée de bandes blanches. Les flancs et le front présentes des taches blanches.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/bourletiellidae/fasciosminthurus-quinquefasciatus/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Fasciosminthurus%20quinquefasciatus.jpeg"
+				},
+				{
+					"key": "30",
+					"label": "Folsomia candida",
+					"description": ""
+				},
+				{
+					"key": "31",
+					"label": "Folsomia quadrioculata",
+					"description": ""
+				},
+				{
+					"key": "32",
+					"label": "Heteromurus major",
+					"description": "Heteromurus major a le corps allongé de couleur grise. Le 4ème segment abdominal est relativement peu allongé par rapport aux Lepidocyrtus ou Entomobrya. Il a un aspect légèrement bossu. Les articles antennaires sont tous de même longueur.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/heteromurus-major/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Heteromurus%20major.jpeg"
+				},
+				{
+					"key": "33",
+					"label": "Heteromurus nitidus",
+					"description": ""
+				},
+				{
+					"key": "34",
+					"label": "Hypogastrura viatica",
+					"description": "• corps allongé, un peu élargi en arrière\r\n• corps recouvert de soies courtes et peu denses\r\n• coloration noir bleuté à violacée\r\n• 8 ocelles\r\n• bouche arrondie\r\n• 2 épines anales très petites, placées sur des papilles\nL’identification des espèces est très complexe sur photo. Il faut pour cela photographier les soies de l’apex des pattes. Le nombre de soies de l’apex du tibiotarse permet de déterminer l’espèce. Ces soies sont appelées « knobbed tenent macrosetae », elles sont spatulées ou élargies en club à l’apex. Il faut compter et voir la disposition de ces soies sur les 3 paires de pattes pour arriver à une identification.\nIl existe 170 espèces dans le monde.\nListe des espèces présentes en France d’après le Catalogue des collemboles de France\n\r\n• Hypogastrura affinis\r\n• Hypogastrura assimilis\r\n• Hypogastrura boldorii\r\n• Hypogastrura capitata\r\n• Hypogastrura chouardi\r\n• Hypogastrura crassaegranulata\r\n• Hypogastrura elevata\r\n• Hypogastrura gisini\r\n• Hypogastrura manubrialis\r\n• Hypogastrura meridionalis\r\n• Hypogastrura monticola\r\n• Hypogastrura neglecta\r\n• Hypogastrura papillata\r\n• Hypogastrura purpurescens\r\n• Hypogastrura pyrenaica\r\n• Hypogastrura ripperi\r\n• Hypogastrura subboldorii\r\n• Hypogastrura tullbergi\r\n• Hypogastrura vernalis\r\n• Hypogastrura viatica",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/hypogastruridae/hypogastrura-sp/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Hypogastrura%20viatica.jpeg"
+				},
+				{
+					"key": "35",
+					"label": "Isotoma riparia",
+					"description": "Le genre Isotoma comprend des espèces au corps allongé et recouvert de longues soies. Les macrosetae sont présentes sur tous les segments abdominaux, ces derniers ayant tous à peu près la même taille. Ils possèdent 8+8 ocelles. La couleur varie du jaune au noir, en passant par le vert et le rougeâtre.\nLes espèces sont pour la plupart difficiles à distinguer, en particulier celles qui sont de couleur uniforme (que ce soit vert, jaune, rougeâtre ou bleuâtre car il y a des variations de ces couleurs au sein d’une même espèce). Pour les séparer, il faut voir l’aspect d’une dent à la base de la furca (simple ou bifide).Isotoma riparia semble être la seule espèce du genre à posséder une ligne médiane sombre sur le dessus du corps.\nVoici la liste des espèces moniale :\r\n• Isotoma acrea : Canada, Alaska\r\n• Isotoma anglicana : Arctique et subarctique, Europe, Asie centrale et de l’ouest, zone méditerranéenne, Canada, Alaska, côte Pacifique de l’Amérique du nord\r\n• Isotoma arctica : Arctique et subarctique, Canada, Alaska\r\n• Isotoma aspera : Côte Pacifique de l’Amérique du nord\r\n• Isotoma burkhardti : Andes\r\n• Isotoma caeca : Europe\r\n• Isotoma caerulea : Europe\r\n• Isotoma crassicornis : ?\r\n• Isotoma decorata : Sahara, désert d’Arabie, désert de Syrie, désert de Lout, désert du Thar\r\n• Isotoma delta : Etats-Unis, Amérique centrale, Caraïbes\r\n• Isotoma diverticula : Himalaya\r\n• Isotoma exiguadentata : Nouvelle-Zélande\r\n• Isotoma finitima : Arctique et subarctique\r\n• Isotoma fulva : Andes\r\n• Isotoma galapagoensis : Andes, Galapagos\r\n• Isotoma gandhi : Andes\r\n• Isotoma glauca : Canada, Alaska\r\n• Isotoma gracilliseta : Chine, Japon, Corée\r\n• Isotoma grana : Chine, Japon, Corée\r\n• Isotoma hibernica : Europe\r\n• Isotoma himalayana : Himalaya, Inde\r\n• Isotoma incerta : Andes\r\n• Isotoma innominata : Europe\r\n• Isotoma iranica : Asie centrale et de l’ouest\r\n• Isotoma kosiana : Europe\r\n• Isotoma littoralis : Chine, Japon, Corée\r\n• Isotoma longispina : Etats-Unis (2/3 est)\r\n• Isotoma mackenziana : Arctique et subarctique, Etats-Unis (2/3 est)\r\n• Isotoma malvinensis : Patagonie\r\n• Isotoma masatierrae : Archipel Juan Fernández\r\n• Isotoma melanocephala : Chine, Japon, Corée\r\n• Isotoma modesta : Europe\r\n• Isotoma nepalica : Himalaya\r\n• Isotoma nishihirai : Asie du sud est continentale\r\n• Isotoma ornata : Patagonie\r\n• Isotoma pallidafasciata : Nouvelle-Zélande\r\n• Isotoma perkinsi : Hawaï\r\n• isotoma pinnata : Chine, Japon, Corée\r\n• Isotoma plumosa : Himalaya\r\n• Isotoma protocinerea : ?\r\n• Isotoma rhopalota : Europe\r\n• Isotoma riparia : Arctique et subarctique, Europe, Eurasie du nord, zone méditerranéenne, (?) Amérique du nord (?)\r\n• Isotoma sarkundensis : Himalaya\r\n• Isotoma schalleri : Amazonie\r\n• Isotoma semenkevitshi : Europe\r\n• Isotoma silvatica : Patagonie\r\n• Isotoma sinensis : Chine, Japon, Corée\r\n• Isotoma spelaea : Europe\r\n• Isotoma spinicauda : Himalaya, Aie centrale et de l’ouest, Inde, (?) Chine, Japon, Corée (?)\r\n• Isotoma subcaerulea : Europe\r\n• Isotoma subviridis : Canada, Alaska, côte Pacifique de l’Amérique du nord, (?) Caraïbes (?)\r\n• Isotoma tahitiensis : Polynésie\r\n• Isotoma termitophila : Sud ouest de l’Australie\r\n• Isotoma tesselata : Pampa\r\n• Isotoma tigrinella : Patagonie\r\n• Isotoma tridenticulata : Chine, Japon, Corée\r\n• Isotoma tridentifera : Malaisie, Cap, Australie\r\n• Isotoma tridentina : Europe\r\n• Isotoma turbotti : Antarctique et subantarctique\r\n• Isotoma vaillanti : zone méditerranéenne\r\n• Isotoma variodentata : Asie centrale et de l’ouest\r\n• Isotoma viridis : Arctique et subarctique, Amérique du nord, Caraïbes, Europe, nord de l’Eurasie, Asie centrale et de l’ouest, Chine, Japon, Corée, zone méditerrannéenne, Macaronésie, Asie du sud est continentale, Sahara, désert d’Arabie, désert de Syrie, désert de Lout, désert du Thar\nEn France, nous n’aurions d’après le « Catalogue des collemboles de France » que Isotoma viridis, mais d’après le site Collembola.org, il pourrait aussi y avoir (espèces notées d’Europe, au moins certaines présentes dans les pays limitrophes) : Isotoma anglicana, Isotoma caeca, Isotoma caerulea, Isotoma hibernica, Isotoma innominata, Isotoma kosiana, Isotoma modesta, Isotoma rhopalota, Isotoma riparia, Isotoma semenkevitshi, Isotoma spelaea, Isotoma subcaerulea, Isotoma tridentina, Isotoma vaillanti",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/isotomidae/isotoma-sp/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Isotoma%20riparia.jpeg"
+				},
+				{
+					"key": "36",
+					"label": "Isotoma viridis",
+					"description": "Le genre Isotoma comprend des espèces au corps allongé et recouvert de longues soies. Les macrosetae sont présentes sur tous les segments abdominaux, ces derniers ayant tous à peu près la même taille. Ils possèdent 8+8 ocelles. La couleur varie du jaune au noir, en passant par le vert et le rougeâtre.\nLes espèces sont pour la plupart difficiles à distinguer, en particulier celles qui sont de couleur uniforme (que ce soit vert, jaune, rougeâtre ou bleuâtre car il y a des variations de ces couleurs au sein d’une même espèce). Pour les séparer, il faut voir l’aspect d’une dent à la base de la furca (simple ou bifide).Isotoma riparia semble être la seule espèce du genre à posséder une ligne médiane sombre sur le dessus du corps.\nVoici la liste des espèces moniale :\r\n• Isotoma acrea : Canada, Alaska\r\n• Isotoma anglicana : Arctique et subarctique, Europe, Asie centrale et de l’ouest, zone méditerranéenne, Canada, Alaska, côte Pacifique de l’Amérique du nord\r\n• Isotoma arctica : Arctique et subarctique, Canada, Alaska\r\n• Isotoma aspera : Côte Pacifique de l’Amérique du nord\r\n• Isotoma burkhardti : Andes\r\n• Isotoma caeca : Europe\r\n• Isotoma caerulea : Europe\r\n• Isotoma crassicornis : ?\r\n• Isotoma decorata : Sahara, désert d’Arabie, désert de Syrie, désert de Lout, désert du Thar\r\n• Isotoma delta : Etats-Unis, Amérique centrale, Caraïbes\r\n• Isotoma diverticula : Himalaya\r\n• Isotoma exiguadentata : Nouvelle-Zélande\r\n• Isotoma finitima : Arctique et subarctique\r\n• Isotoma fulva : Andes\r\n• Isotoma galapagoensis : Andes, Galapagos\r\n• Isotoma gandhi : Andes\r\n• Isotoma glauca : Canada, Alaska\r\n• Isotoma gracilliseta : Chine, Japon, Corée\r\n• Isotoma grana : Chine, Japon, Corée\r\n• Isotoma hibernica : Europe\r\n• Isotoma himalayana : Himalaya, Inde\r\n• Isotoma incerta : Andes\r\n• Isotoma innominata : Europe\r\n• Isotoma iranica : Asie centrale et de l’ouest\r\n• Isotoma kosiana : Europe\r\n• Isotoma littoralis : Chine, Japon, Corée\r\n• Isotoma longispina : Etats-Unis (2/3 est)\r\n• Isotoma mackenziana : Arctique et subarctique, Etats-Unis (2/3 est)\r\n• Isotoma malvinensis : Patagonie\r\n• Isotoma masatierrae : Archipel Juan Fernández\r\n• Isotoma melanocephala : Chine, Japon, Corée\r\n• Isotoma modesta : Europe\r\n• Isotoma nepalica : Himalaya\r\n• Isotoma nishihirai : Asie du sud est continentale\r\n• Isotoma ornata : Patagonie\r\n• Isotoma pallidafasciata : Nouvelle-Zélande\r\n• Isotoma perkinsi : Hawaï\r\n• isotoma pinnata : Chine, Japon, Corée\r\n• Isotoma plumosa : Himalaya\r\n• Isotoma protocinerea : ?\r\n• Isotoma rhopalota : Europe\r\n• Isotoma riparia : Arctique et subarctique, Europe, Eurasie du nord, zone méditerranéenne, (?) Amérique du nord (?)\r\n• Isotoma sarkundensis : Himalaya\r\n• Isotoma schalleri : Amazonie\r\n• Isotoma semenkevitshi : Europe\r\n• Isotoma silvatica : Patagonie\r\n• Isotoma sinensis : Chine, Japon, Corée\r\n• Isotoma spelaea : Europe\r\n• Isotoma spinicauda : Himalaya, Aie centrale et de l’ouest, Inde, (?) Chine, Japon, Corée (?)\r\n• Isotoma subcaerulea : Europe\r\n• Isotoma subviridis : Canada, Alaska, côte Pacifique de l’Amérique du nord, (?) Caraïbes (?)\r\n• Isotoma tahitiensis : Polynésie\r\n• Isotoma termitophila : Sud ouest de l’Australie\r\n• Isotoma tesselata : Pampa\r\n• Isotoma tigrinella : Patagonie\r\n• Isotoma tridenticulata : Chine, Japon, Corée\r\n• Isotoma tridentifera : Malaisie, Cap, Australie\r\n• Isotoma tridentina : Europe\r\n• Isotoma turbotti : Antarctique et subantarctique\r\n• Isotoma vaillanti : zone méditerranéenne\r\n• Isotoma variodentata : Asie centrale et de l’ouest\r\n• Isotoma viridis : Arctique et subarctique, Amérique du nord, Caraïbes, Europe, nord de l’Eurasie, Asie centrale et de l’ouest, Chine, Japon, Corée, zone méditerrannéenne, Macaronésie, Asie du sud est continentale, Sahara, désert d’Arabie, désert de Syrie, désert de Lout, désert du Thar\nEn France, nous n’aurions d’après le « Catalogue des collemboles de France » que Isotoma viridis, mais d’après le site Collembola.org, il pourrait aussi y avoir (espèces notées d’Europe, au moins certaines présentes dans les pays limitrophes) : Isotoma anglicana, Isotoma caeca, Isotoma caerulea, Isotoma hibernica, Isotoma innominata, Isotoma kosiana, Isotoma modesta, Isotoma rhopalota, Isotoma riparia, Isotoma semenkevitshi, Isotoma spelaea, Isotoma subcaerulea, Isotoma tridentina, Isotoma vaillanti",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/isotomidae/isotoma-sp/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Isotoma%20viridis.jpeg"
+				},
+				{
+					"key": "37",
+					"label": "Isotomiella minor",
+					"description": ""
+				},
+				{
+					"key": "38",
+					"label": "Isotomurus gallicus",
+					"description": ""
+				},
+				{
+					"key": "39",
+					"label": "Isotomurus maculatus",
+					"description": "Ce genre se reconnait à sa forme allongée, Ses articles antennaires plus ou moins tous de même longueur, son 4ème segment abdominal plus ou moins de même longueur que le 3ème, la présence de macrosètes (grandes soies effilées à l’apex et courbées) uniquement sur les segments abdominaux 4 à 6 et la présence de trichobothries (soies cylindriques très fines). Compte tenu de la variabilité du genre et des difficultés d’identification de certains spécimens, je classerais ici tous ceux dont l’identification au delà du genre est incertaine.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/isotomurus-sp/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Isotomurus%20maculatus.jpeg"
+				},
+				{
+					"key": "40",
+					"label": "Isotomurus palustris",
+					"description": "Isotomurus palustris est une espèce très variable et présente de nombreuses formes (bande centrale sur le dos plus ou moins fine, souvent assez courte, 2 bandes latérales, toutes 3 pouvant être coupées en pointillés et très peu visibles, avec ou sans une couronne sur abd 4…). Son corps est allongée, ses articles antennaires sont plus ou moins tous de même longueur, son 4ème segment abdominal est plus ou moins de même longueur que le 3ème, il possède des macrosètes (grandes soies effilées à l’apex et courbées) uniquement sur les segments abdominaux 4 à 6 et des trichobothries (soies cylindriques très fines).",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/isotomidae/isotomurus-palustris/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Isotomurus%20palustris.jpeg"
+				},
+				{
+					"key": "41",
+					"label": "Isotomurus unifasciatus",
+					"description": ""
+				},
+				{
+					"key": "42",
+					"label": "Kalaphorura burmeisteri",
+					"description": "Kalaphorura burmeisteri a les antennes plus courtes que la tête, le 1er segment thoracique est présent, les pattes sont petites, elle n’a pas d’yeux ni de pigmentation sur le corps. Le corps est plus large au milieu, le premier segment antennaire est élargi, elle possède deux épines anales.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/onychiuridae/kalaphorura-burmeisteri/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Kalaphorura%20burmeisteri.jpeg"
+				},
+				{
+					"key": "43",
+					"label": "Lepidocyrtus curvicollis",
+					"description": "Lepidocyrtus curvicollis est un collembole allongé au corps recouvert d’écailles grises. Les articles antennaires sont tous de même longueur, et le 4ème segment abdominal est allongé. Le thorax en vue de profil forme un angle de 90°., son extrémité en vue de dessus est arrondie. Ses pattes sont généralement grises.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/lepidocyrtus-curvicollis/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Lepidocyrtus%20curvicollis.jpeg"
+				},
+				{
+					"key": "44",
+					"label": "Lepidocyrtus cyaneus",
+					"description": "Lepidocyrtus cyaneus se reconnait à son corps en forme de cône, avec des reflets violets sur les écailles. La base des antennes ne possède pas d’écailles, les pattes non plus. Il possède de grandes soies entre les yeux. Son corps est bleuté derrière les écailles.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/lepidocyrtus-cyaneus/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Lepidocyrtus%20cyaneus.jpeg"
+				},
+				{
+					"key": "45",
+					"label": "Lepidocyrtus fimetarius",
+					"description": ""
+				},
+				{
+					"key": "46",
+					"label": "Lepidocyrtus lignorum",
+					"description": "• corps cylindrique\r\n• corps recouvert d’écailles argentées à quelques reflets violets et bleus\r\n• 4ème segment abdominal allongé\r\n• pas d’angle droit marqué sur le thorax au-dessus de la tête\r\n• présence de soies interantennaires\r\n• pas de soies interoculaires\r\n• présence d’écailles sur les deux premiers segments antennaires et les pattes (mais ces dernières peuvent être peu visibles ou disparaitre par frottement)\r\n• articles antennaires 3 et 4 sans écailles",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/lepidocyrtus-lignorum/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Lepidocyrtus%20lignorum.jpeg"
+				},
+				{
+					"key": "47",
+					"label": "Lepidocyrtus paradoxus",
+					"description": ""
+				},
+				{
+					"key": "48",
+					"label": "Megalothorax minimus",
+					"description": ""
+				},
+				{
+					"key": "49",
+					"label": "Monobella grassei",
+					"description": "Monobella grassei est un collembole au corps allongé et boudiné avec de longues soies. Il est de couleur jaune pâle à orangé avec de petits tubercules discrets à l’apex des segments. Le 6ème segment abdominal est bilobé et caché sous le 5ème. Il possède deux petits ocelles noirs bien séparés, l’apex de ses antennes est blanchâtre.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/neanuridae/monobella-grassei/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Monobella%20grassei.jpeg"
+				},
+				{
+					"key": "50",
+					"label": "Neanura muscorum",
+					"description": "Neanura muscorum a un corps allongé et boudiné de couleur bleu-mauve. Ses antennes sont petites et le 1er segment thoracique est présent. Le 6ème segment abdominal possède deux lobes terminaux et il est placé à la suite du 5ème segment, qui lui porte 4 lobes terminaux. La disposition ocellaire est de 2+1 ocelle. Les pièces buccales sont en forme de cône.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/neanuridae/neanura-muscorum/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Neanura%20muscorum.jpeg"
+				},
+				{
+					"key": "51",
+					"label": "Neelus murinus",
+					"description": "Neelus murinus est un collembole sans yeux, avec un corps rond et d’aspect bossu plus ou moins brun orangé. Il possède des soies à l’arrière de l’abdomen. Sa tête est allongée. Ses antennes sont relativement longues et fines. La furca possède des mucrons longs et étroits.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/neelidae/neelus-murinus/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Neelus%20murinus.jpeg"
+				},
+				{
+					"key": "52",
+					"label": "Orchesella bifasciata",
+					"description": ""
+				},
+				{
+					"key": "53",
+					"label": "Orchesella cincta",
+					"description": "Orchesella cincta a un corps allongé avec de grandes antennes. Le 2ème segment est subdivisé en deux parties. Le 1e segment antennaire est brun dans sa première moitié, blanc dans sa deuxième moitié. Les segments 3 et 4 sont bruns sans trop de contraste entre eux. Le 4ème segment de l’abdomen est plus long que le 3ème. Le 3ème segment abdominal est assombri et contraste avec l’apex clair du 2nd segment.Les mâles sont très sombres avec le second article antennaire entièrement noir.Les femelles sont brunes, le second article antennaire est sombre dans sa première subdivision, puis brun clair avec finalement l’apex sombre.Les adultes ont la tête noire.Les jeunes ont la tête claire.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/orchesella-cincta/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Orchesella%20cincta.jpeg"
+				},
+				{
+					"key": "54",
+					"label": "Orchesella flavescens",
+					"description": "Orchesella flavescens a un corps étroit et allongé, recouvert de longues soies. Le 4ème segment abdominal est allongé. La coloration générale est jaune à cannelle, avec une double bande brune longitudinale sur les côtés du corps. Les antennes sont longues, à articles 1 et 2 subdivisés. Elles sont fragiles, et il n’est pas rare de voir des individus aux antennes asymétriques ou tronquées. Leur couleur varie, mais il n’est pas rare qu’elles soient annelées de noir et de blanc ou de jaunâtre et de rougeâtre.\nIl existe plusieurs formes supplémentaires :\r\n• la var. melanocephala a la tête noire, ainsi que le 4eme segment abdominal et parfois aussi le 3ème segment thoracique. Le second article antennaire est noir, le premier soit tout noir soit noir à la base puis blanc à l’apex. La base du troisième article est très pâle. Les côtés du corps ainsi que l’apex des segments abdominaux 2 et 3 sont plus clairs que le reste du corps. Les pattes sont souvent bariolées, avec l’apex des fémurs plus sombre. Le reste du corps est variablement assombri.\r\n• la forme principalis est un peu plus pâle que la var melanocephala, la tête étant souvent assombrie mais pas noire, ce qui est également le cas pour le 4ème segment abdominal. Le 3ème segment thoracique est encore moins assombri, voire pas du tout.\r\n• la forme medialis possède une vague bande plus sombre sur le dessus du thorax et de l’abdomen.\r\n• la forme rufescens a les bandes dorsales rousses, et le corps plus ou moins orangé.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/orchesella-flavescens/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Orchesella%20flavescens.jpeg"
+				},
+				{
+					"key": "55",
+					"label": "Orchesella quinquefasciata",
+					"description": "Orchesella quinquefasciata est un grand collembole au corps recouvert de longues soies dressées, denses surtout sur le thorax. Son deuxième segment antennaire est subdivisé, comme chez toutes les espèces du genre. Il possède 5 lignes longitudinales sur le dessus du corps et un bandeau sombre entre les yeux. Le dessin du 4ème segment abdominal est variable, généralement bien présent.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/orchesella-quinquefasciata/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Orchesella%20quinquefasciata.jpeg"
+				},
+				{
+					"key": "56",
+					"label": "Orchesella villosa",
+					"description": "Orchesella villosa a un corps allongé avec de grandes antennes. Le 4ème segment de l’abdomen est plus long que le 3ème. Il peut être de couleur jaunâtre à brunâtre, avec une forte pilosité. le thorax possède 3 bandes longitudinales : une au centre et deux sur les côtés pratiquement à la marge. Il peut y avoir une bande supplémentaires entre la bande centrale et celle de la marge (5 bandes donc) mais cette dernière n’atteint pas la marge postérieure du segment. L’abdomen possède diverses marques sombres, avec des bandes en « U » partant de la base des segments. les antennes sont fortement marquées de bandes sombre/clair contrastant, en particulier sur les premiers segments. Les eux sont reliés entre eux par un bandeau sombre.Les jeunes sont moins contrastés.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/orchesella-villosa/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Orchesella%20villosa.jpeg"
+				},
+				{
+					"key": "57",
+					"label": "Parisotoma notabilis",
+					"description": "Parisotoma notabilis a un corps allongé et velu, de couleur gris pâle. Ses antennes sont courtes et composées de 4 articles. Il possède un petit carré de 4 ocelles en avant de la tête.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/isotomidae/parisotoma-notabilis/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Parisotoma%20notabilis.jpeg"
+				},
+				{
+					"key": "58",
+					"label": "Podura aquatica",
+					"description": "Podura aquatica a un corps ovale et ramassé. Il est boudiné avec une tête assez imposante et de grosses joues. Il possède un gros repli de peau entre les yeux. Les griffes sont très longues. Il est de couleur gris bleuâtre sombre, avec souvent les pattes et les antennes rosées.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/poduridae/podura-aquatica/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Podura%20aquatica.jpeg"
+				},
+				{
+					"key": "59",
+					"label": "Pogonognathellus flavescens",
+					"description": ""
+				},
+				{
+					"key": "60",
+					"label": "Pogonognathellus longicornis",
+					"description": "Pogonognathellus longicornis a un corps allongé et recouvert d’écailles grises. Ses antennes sont très longes, plus longues que le corps. Le 3ème segment antennaire est plus long que les autres et effilé à son apex. Il enroule souvent l’extrémité de ses antennes.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/tomoceridae/pogonognathellus-longicornis/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Pogonognathellus%20longicornis.jpeg"
+				},
+				{
+					"key": "61",
+					"label": "Seira ferrarii",
+					"description": ""
+				},
+				{
+					"key": "62",
+					"label": "Seira musarum",
+					"description": ""
+				},
+				{
+					"key": "63",
+					"label": "Sminthurides aquaticus",
+					"description": "Sminthurides aquaticus est de couleur jaunâtre avec une pigmentation bleu gris sur le dos et une tache sombre sur le front. Le mucron de la furca est élargi en forme de lamelle.La femelle est plus grande que le mâle et n’a pas le 4ème segment antennaire subdivisé.Le mâle a ‘antenne modifiée en « crochet » pour s’agripper à celles de la femelle.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/sminthurididae/sminthurides-aquaticus/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Sminthurides%20aquaticus.jpeg"
+				},
+				{
+					"key": "64",
+					"label": "Sminthurides malmgreni",
+					"description": "Sminthurides malmgreni est un petit collembole au corps rond, jaune, avec l’abdomen ceintré d’une bande rose prune. Certaines formes possèdent une bande dorsale rose prune plus ou moins large, parfois divisée en deux lignes laissant apparaitre une bande centrale de la couleur du corps. Les antennes sont mauves, surtout le dernier article. La forme principalis est entièrement violette.Le mâle est plus petit que la femelle et a les antennes modifiées.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/sminthurididae/sminthurides-malmgreni/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Sminthurides%20malmgreni.jpeg"
+				},
+				{
+					"key": "65",
+					"label": "Sminthurides penicillifer",
+					"description": ""
+				},
+				{
+					"key": "66",
+					"label": "Sminthurinus aureus",
+					"description": "Sminthurinus aureus est de couleur jaune orangé parfois avec des taches plus claires sur le corps et bandes plus sombres sur les flancs. Les sourcils sont plus clairs également. Le 4ème article antennaire est assombri. Le segment abdominal 5 est fusionné avec le reste de l’abdomen dorsalement et ventralement.La forme ochropus a le corps brun noir avec les antennes et les pattes jaunâtres et le sourcil clair.La forme atrata a le corps noir bleuté ainsi que les pattes et les antennes.La forme reticulatus est orange avec une bande grise à brune sur les flancs et des lignes transversales oranges sur le dessus de l’abdomen.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/katiannidae/sminthurinus-aureus/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Sminthurinus%20aureus.jpeg"
+				},
+				{
+					"key": "67",
+					"label": "Sminthurinus elegans",
+					"description": "Sminthurinus elegans est de couleur jaunâtre. Le dessus de sa tête est sombre, avec des « sourcils » clairs. Un bandeau brun traverse la face. L’abdomen est ceinturé au niveau des flancs d’une bande brune. Une deuxième bande brune parcourt les côtés de l’abdomen au-dessus de la première. Le dos peut-être parcouru d’une fine ligne brune. L’étendue de brun peur varier, et certaines formes sont très sombres.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/katiannidae/sminthurinus-elegans/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Sminthurinus%20elegans.jpeg"
+				},
+				{
+					"key": "68",
+					"label": "Sminthurinus lawrencei",
+					"description": "Sminthurinus lawrencei est un collembole de couleur noire plus ou moins bleutée ou violacée. Il possède un court sourcil blanc. L’ocelle D située au centre de l’œil n’est pas visible. Il possède une verrue à la base du 3ème segment antennaire. Le 5ème segment abdominal n’est pas fusionné avec le gros abdomen.Jusque récemment, la plupart des individus étaient nommés S. niger, mais des études récentes ont montré qu’il ‘agit en fait de S. lawrencei et que S. niger était beaucoup plus rare.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/katiannidae/sminthurinus-niger/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Sminthurinus%20lawrencei.jpeg"
+				},
+				{
+					"key": "69",
+					"label": "Sminthurinus niger",
+					"description": ""
+				},
+				{
+					"key": "70",
+					"label": "Sminthurinus trinotatus",
+					"description": ""
+				},
+				{
+					"key": "71",
+					"label": "Sminthurus viridis",
+					"description": "Sminthurus viridis a un corps arrondi avec de longues soies sur toute sa surface. Le 4ème segment antennaire est plus long que le 3ème. Elle est de couleur verte à jaune avec parfois des taches d’intensités différentes. La ssp cinereoviridis est beige à taches brun plus sombre, avec une ligne médiane sombre sur l’abdomen.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/sminthuridae/sminthurus-viridis/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Sminthurus%20viridis.jpeg"
+				},
+				{
+					"key": "72",
+					"label": "Tomocerus minor",
+					"description": "• corps allongé, recouvert d’écailles\r\n• coloration gris argenté uniforme\r\n• antennes de 4 articles, longues mais plus courtes que le corps\r\n• le 3ème article antennaire beaucoup plus long que les autres et sans écailles (mais avec de fines soies), de couleur rose ou grise\r\n• collier de soies à la base du thorax\r\n• yeux composés de 6 ocelles\r\n• les 4 ocelles antérieurs forment un carré, la distance entre les ocelles A-C et B-D est à peu près égale",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/tomoceridae/tomocerus-minor/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Tomocerus%20minor.jpeg"
+				},
+				{
+					"key": "73",
+					"label": "Tomocerus vulgaris",
+					"description": ""
+				},
+				{
+					"key": "74",
+					"label": "Vertagopus asiaticus",
+					"description": ""
+				},
+				{
+					"key": "75",
+					"label": "Vitronura giselae",
+					"description": ""
+				},
+				{
+					"key": "76",
+					"label": "Willowsia buski",
+					"description": ""
+				},
+				{
+					"key": "77",
+					"label": "Willowsia nigromaculata",
+					"description": "• coloration brun jaunâtre\r\n• présence d’écailles sur le corps\r\n• bandeau sombre entre les yeux\r\n• anneau sombre à l’apex des fémurs 3, parfois des autres également\r\n• bande latérale sombre sur le corps\r\n• 4ème segment abdominal allongé\r\n• apex du 3ème segment abdominal à bande sombre remontant vers la base du segment sur les côtés\r\n• 4ème segment abdominal à bande centrale en zigzag interrompue en son centre, pouvant ne former que deux taches latérales\r\n• 4ème segment abdominal à apex sombre\r\n• apex des 5ème et 6ème segments abdominaux noirs\r\n• apex des segments thoraciques et des 2 premiers segments abdominaux à bande sombre légère pouvant manquer",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/willowsia-nigromaculata/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Willowsia%20nigromaculata.jpeg"
+				},
+				{
+					"key": "78",
+					"label": "Willowsia platani",
+					"description": "Willowsia platani a un pattern sombre rayé de pâle. Sa tête est pâle avec un bandeau noir entre les yeux. Le segment 2 du thorax est clair, le segment 3 sombre. Le segment abdominal 1 est clair, le 2 et le 3 sont plus ou moins sombre, il possède une bande claire à la base et à l’apex du 4. Il a une tache noire à l’apex du fémur 3.",
+					"learnMore": "https://jessica-joachim.com/entognathes/collemboles/entomobryidae/willowsia-platani/",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Willowsia%20platani.jpeg"
+				},
+				{
+					"label": "Byturus tomentosus",
+					"key": "79",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Byturus tomentosus.png",
+					"description": "Nom vernaculaire : Ver des framboises\n\nEspèce(s) semblable(s) : _[Byturus ochraceus](https://jessica-joachim.com/insectes/coleopteres-scarabees-coccinelles/byturidae/byturus-ochraceus/)_ dont les yeux sont plus gros ([comparer](https://www.galerie-insecte.org/galerie/viewfull.php?ref=255957)). **Attention** ce critère est parfois difficile à apprécier.\n\nA corriger sur le comparatif : B.aestivus = B.ochraceus\n\nInformation(s) utile(s): Presque uniquement sur fleurs de Rosaceae\n\nPlus de photos : [Galerie LMDI](https://www.galerie-insecte.org/galerie/wikige.php?tax=byturus%20tomentosus)\n\nComplément d’informations et sources : [INPN](https://inpn.mnhn.fr/espece/cd_nom/222189) ; [LMDI](https://www.insecte.org/forum/index.php)\n\nCrédit photo : [Gilles Carcassès](https://www.galerie-insecte.org/galerie/ref-321918.htm) ; [Fred Chevaillot](https://www.galerie-insecte.org/galerie/ref-255957.htm)",
+					"links": {
+						"https://jessica-joachim.com/insectes/coleopteres-scarabees-coccinelles/byturidae/byturus-ochraceus/": "Byturus ochraceus",
+						"https://www.galerie-insecte.org/galerie/viewfull.php?ref=255957": "comparer",
+						"https://www.galerie-insecte.org/galerie/wikige.php?tax=byturus%20tomentosus": "Galerie LMDI ",
+						"https://inpn.mnhn.fr/espece/cd_nom/222189": "INPN",
+						"https://www.insecte.org/forum/index.php": "LMDI",
+						"https://www.galerie-insecte.org/galerie/ref-321918.htm": "Gilles Carcassès",
+						"https://www.galerie-insecte.org/galerie/ref-255957.htm": "Fred Chevaillot"
+					},
+					"learnMore": "https://inpn.mnhn.fr/espece/cd_nom/222189"
+				},
+				{
+					"label": "Melolontha hippocastani",
+					"key": "80",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Melolontha hippocastani.png",
+					"description": "Nom vernaculaire : Grand hanneton forestier\n\nEspèce(s) semblable(s) : [Melolontha melol](https://jessica-joachim.com/insectes/coleopteres-scarabees-coccinelles/scarabaeidae/hanneton-commun-melolontha-melolontha/)[ontha](https://jessica-joachim.com/insectes/coleopteres-scarabees-coccinelles/scarabaeidae/hanneton-commun-melolontha-melolontha/) (pointe du pygidium plus longue et plus large) ; [Melolontha pectoralis](https://www.galerie-insecte.org/galerie/wikige.php?tax=melolontha%20pectoralis) (pointe du pygidium encore plus courte, seulement présent dans le Nord-Est de la France)\n\nInformation(s) utile(s): Espèce généralement plus forestière que _Melolontha melolontha_. [Comparatif](https://www.galerie-insecte.org/galerie/view.php?ref=8434) des pygidium de _M.melolontha_ et _M.hippocastani_\n\nPlus de photos : [Galerie LMDI](https://www.galerie-insecte.org/galerie/wikige.php?tax=melolontha%20hippocastani)\n\nComplément d’informations et sources : [INPN](https://inpn.mnhn.fr/espece/cd_nom/10879) ; [LMDI](https://www.insecte.org/forum/index.php)\n\nCrédit photo : [Florentin Madrolles](https://www.galerie-insecte.org/galerie/ref-64168.htm) ; [Piezo](https://www.galerie-insecte.org/galerie/fiche.php?ref=8434)",
+					"links": {
+						"https://jessica-joachim.com/insectes/coleopteres-scarabees-coccinelles/scarabaeidae/hanneton-commun-melolontha-melolontha/": "ontha",
+						"https://www.galerie-insecte.org/galerie/wikige.php?tax=melolontha%20pectoralis": "Melolontha pectoralis",
+						"https://www.galerie-insecte.org/galerie/view.php?ref=8434": "Comparatif",
+						"https://www.galerie-insecte.org/galerie/wikige.php?tax=melolontha%20hippocastani": "Galerie LMDI",
+						"https://inpn.mnhn.fr/espece/cd_nom/10879": "INPN",
+						"https://www.insecte.org/forum/index.php": "LMDI",
+						"https://www.galerie-insecte.org/galerie/ref-64168.htm": "Florentin Madrolles",
+						"https://www.galerie-insecte.org/galerie/fiche.php?ref=8434": "Piezo"
+					},
+					"learnMore": "https://inpn.mnhn.fr/espece/cd_nom/10879"
+				},
+				{
+					"label": "Meloe violaceus",
+					"key": "81",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Meloe violaceus.png",
+					"description": "Nom vernaculaire : Meloe enfle-boeufs violet\n\nEspèce(s) semblable(s) : _[Meloe proscarabe](https://jessica-joachim.com/insectes/coleopteres-scarabees-coccinelles/meloidae/meloe-printanier-meloe-proscarabaeus/)__[us](https://jessica-joachim.com/insectes/coleopteres-scarabees-coccinelles/meloidae/meloe-printanier-meloe-proscarabaeus/)_ ; _[Meloe autumnalis](https://www.galerie-insecte.org/galerie/wikige.php?tax=meloe%20autumnalis)_ (apparaît uniquement à automne)\n\nInformation(s) utile(s): Cette espèce est présente uniquement au printemps\n\n[Fiche comparative](https://ressources.shna-ofab.fr/shna-ofab/fichiers__pdf_/3-ressources/3-aides_a_la_determination/note_didentification_e-obs_meloe_printanier_ou_meloe_violace_2021.pdf) des _Meloe_ printaniers\n\nPlus de photos : [Galerie LMDI](https://www.galerie-insecte.org/galerie/Meloe_violaceus.html)\n\nComplément d’informations et sources : [INPN](https://inpn.mnhn.fr/espece/cd_nom/12113) ; [SHNA-OFAB](https://www.shna-ofab.fr/) ; [LMDI](https://www.insecte.org/forum/index.php) ;\n\nCrédit photo : [Renko Usami](https://www.galerie-insecte.org/galerie/ref-159239.htm) ; [Phil](https://www.galerie-insecte.org/galerie/ref-83831.htm) ; [Damien GRILLIERE](https://www.galerie-insecte.org/galerie/ref-321060.htm)\n\nMaxime Cauchoix2025-05-07T09:04:11.120000000\n\ncritère(s) principaux différencier de violaceus",
+					"links": {
+						"https://jessica-joachim.com/insectes/coleopteres-scarabees-coccinelles/meloidae/meloe-printanier-meloe-proscarabaeus/": "us",
+						"https://www.galerie-insecte.org/galerie/wikige.php?tax=meloe%20autumnalis": "Meloe autumnalis",
+						"https://ressources.shna-ofab.fr/shna-ofab/fichiers__pdf_/3-ressources/3-aides_a_la_determination/note_didentification_e-obs_meloe_printanier_ou_meloe_violace_2021.pdf": "Fiche comparative",
+						"https://www.galerie-insecte.org/galerie/Meloe_violaceus.html": "Galerie LMDI",
+						"https://inpn.mnhn.fr/espece/cd_nom/12113": "INPN",
+						"https://www.shna-ofab.fr/": "SHNA-OFAB",
+						"https://www.insecte.org/forum/index.php": "LMDI",
+						"https://www.galerie-insecte.org/galerie/ref-159239.htm": "Renko Usami",
+						"https://www.galerie-insecte.org/galerie/ref-83831.htm": "Phil",
+						"https://www.galerie-insecte.org/galerie/ref-321060.htm": "Damien GRILLIERE"
+					},
+					"learnMore": "https://inpn.mnhn.fr/espece/cd_nom/12113"
+				},
+				{
+					"label": "Pyrrhidium sanguineum",
+					"key": "82",
+					"image": "https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.images/Pyrrhidium sanguineum.png",
+					"description": "Nom vernaculaire : Cardinal imposteur\n\nEspèce(s) semblable(s) : Aucune chez les Cerambycidae, mais attention aux _[Pyrochroa](https://jessica-joachim.com/insectes/coleopteres-scarabees-coccinelles/pyrochroidae/)_ dont les antennes sont dentées.\n\nInformation(s) utile(s): Très précoce (dès février), souvent dans le bois de chauffage\n\nPlus de photos : [Galerie LMDI](https://www.galerie-insecte.org/galerie/Pyrrhidium_sanguineum.html)\n\nComplément d’informations et sources : [INPN](https://inpn.mnhn.fr/espece/cd_nom/12357) ; [LMDI](https://www.insecte.org/forum/index.php)\n\nCrédit photo : [Yves Dubois](https://www.galerie-insecte.org/galerie/ref-159923.htm) ; [Pierre Gros](https://www.galerie-insecte.org/galerie/ref-199258.htm)",
+					"links": {
+						"https://jessica-joachim.com/insectes/coleopteres-scarabees-coccinelles/pyrochroidae/": "Pyrochroa",
+						"https://www.galerie-insecte.org/galerie/Pyrrhidium_sanguineum.html": "Galerie LMDI ",
+						"https://inpn.mnhn.fr/espece/cd_nom/12357": "INPN",
+						"https://www.insecte.org/forum/index.php": "LMDI",
+						"https://www.galerie-insecte.org/galerie/ref-159923.htm": "Yves Dubois",
+						"https://www.galerie-insecte.org/galerie/ref-199258.htm": "Pierre Gros"
+					},
+					"learnMore": "https://inpn.mnhn.fr/espece/cd_nom/12357"
+				}
+			],
+			"taxonomic": {
+				"clade": "species",
+				"parent": {
+					"0": "allacma",
+					"1": "anurida",
+					"2": "bilobella",
+					"3": "bilobella",
+					"4": "bourletiella",
+					"5": "bourletiella",
+					"6": "brachystomella",
+					"7": "caprainea",
+					"8": "",
+					"9": "ceratophysella",
+					"10": "cyphoderus",
+					"11": "deuterosminthurus",
+					"12": "deuterosminthurus",
+					"13": "dicyrtoma",
+					"14": "dicyrtomina",
+					"15": "dicyrtomina",
+					"16": "dicyrtomina",
+					"17": "dicyrtomina",
+					"18": "dicyrtomina",
+					"19": "entomobrya",
+					"20": "entomobrya",
+					"21": "",
+					"22": "entomobrya",
+					"23": "",
+					"24": "",
+					"25": "entomobrya",
+					"26": "entomobrya",
+					"27": "",
+					"28": "entomobrya",
+					"29": "fasciosminthurus",
+					"30": "",
+					"31": "folsomia",
+					"32": "heteromurus",
+					"33": "heteromurus",
+					"34": "hypogastrura",
+					"35": "isotoma",
+					"36": "isotoma",
+					"37": "isotomiella",
+					"38": "isotomurus",
+					"39": "isotomurus",
+					"40": "",
+					"41": "isotomurus",
+					"42": "kalaphorura",
+					"43": "lepidocyrtus",
+					"44": "lepidocyrtus",
+					"45": "lepidocyrtus",
+					"46": "lepidocyrtus",
+					"47": "lepidocyrtus",
+					"48": "megalothorax",
+					"49": "monobella",
+					"50": "neanura",
+					"51": "neelus",
+					"52": "orchesella",
+					"53": "orchesella",
+					"54": "orchesella",
+					"55": "orchesella",
+					"56": "orchesella",
+					"57": "parisotoma",
+					"58": "podura",
+					"59": "",
+					"60": "pogonognathellus",
+					"61": "seira",
+					"62": "seira",
+					"63": "sminthurides",
+					"64": "sminthurides",
+					"65": "sminthurides",
+					"66": "",
+					"67": "sminthurinus",
+					"68": "sminthurinus",
+					"69": "sminthurinus",
+					"70": "sminthurinus",
+					"71": "",
+					"72": "tomocerus",
+					"73": "",
+					"74": "vertagopus",
+					"75": "vitronura",
+					"76": "willowsia",
+					"77": "willowsia",
+					"78": "willowsia"
+				}
+			},
+			"infer": {
+				"neural": {
+					"model": "https://cigaleapp.github.io/models/model_classif.onnx",
+					"metadata": "io.github.cigaleapp.arthropods.example__species",
+					"input": {
+						"height": 224,
+						"width": 224,
+						"disposition": "CHW",
+						"normalized": true
+					}
+				}
+			}
+		}
+	},
+	"crop": {
+		"metadata": "io.github.cigaleapp.arthropods.example__crop",
+		"confirmationMetadata": "io.github.cigaleapp.arthropods.example__crop_is_confirmed",
+		"infer": {
+			"model": "https://cigaleapp.github.io/models/arthropod_detector_yolo11n_conf0.437.onnx",
+			"input": {
+				"height": 640,
+				"width": 640,
+				"disposition": "1CHW",
+				"normalized": true
+			},
+			"output": {
+				"normalized": true,
+				"shape": ["sx", "sy", "ex", "ey", "score", "_"]
+			}
+		}
+	},
+	"exports": {
+		"images": {
+			"cropped": "Cropped/{{ fallback image.protocolMetadata.species.valueLabel \"(Unknown)\" }}_{{ sequence }}.{{ extension image.filename }}",
+			"original": "Original/{{ fallback image.protocolMetadata.species.valueLabel \"(Unknown)\" }}_{{ sequence }}.{{ extension image.filename }}"
+		},
+		"metadata": {
+			"json": "analysis.json",
+			"csv": "metadata.csv"
+		}
+	}
+}
diff --git a/scripts/jessica-joachim-crawler.js b/scripts/jessica-joachim-crawler.js
index 02ac3eb..960ec61 100644
--- a/scripts/jessica-joachim-crawler.js
+++ b/scripts/jessica-joachim-crawler.js
@@ -1,12 +1,11 @@
 import { execa } from 'execa';
 import { JSDOM } from 'jsdom';
 import { marked } from 'marked';
+import { writeFileSync } from 'node:fs';
 import { mkdir, writeFile } from 'node:fs/promises';
 import path from 'node:path';
 import Turndown from 'turndown';
-import getCurrentLine from 'get-current-line';
 import { default as taxonomy } from '../static/taxonomy.json' with { type: 'json' };
-import { writeFileSync } from 'node:fs';
 
 // ANSI control sequences
 const cc = {
@@ -83,7 +82,10 @@ const protocol = {
 	$schema: 'https://cigaleapp.github.io/cigale/protocol.schema.json',
 	id: 'io.github.cigaleapp.arthropods.transects',
 	name: "Transect d'arthropodes",
-	source: `https://github.com/cigaleapp/cigale/tree/${await execa`git rev-parse HEAD`.then((result) => result.stdout)}/scripts/jessica-joachim-crawler.js#L${getCurrentLine().line}`,
+	learnMore: `https://github.com/cigaleapp/cigale/tree/${await execa`git rev-parse HEAD`.then((result) => result.stdout)}/scripts/README.md#protocoles-arthropods-transects`,
+	version: 1,
+	source:
+		'https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.json',
 	description:
 		'Protocole de transect pour l’identification des arthropodes. Descriptions et photos des espèces de Jessica Joachim, cf https://jessica-joachim.com/identification',
 	authors: [
diff --git a/src/lib/ButtonUpdateProtocol.svelte b/src/lib/ButtonUpdateProtocol.svelte
new file mode 100644
index 0000000..c60ff65
--- /dev/null
+++ b/src/lib/ButtonUpdateProtocol.svelte
@@ -0,0 +1,138 @@
+<script>
+	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
+	import { hasUpgradeAvailable, upgradeProtocol } from '$lib/protocols';
+	import { toasts } from '$lib/toasts.svelte';
+	import IconUpgrade from '~icons/ph/arrow-circle-up';
+	import IconArrow from '~icons/ph/arrow-right';
+	import IconCheckAgain from '~icons/ph/arrows-counter-clockwise';
+	import IconUpToDate from '~icons/ph/check-circle';
+	import IconCannotCheckForUpdates from '~icons/ph/warning-circle';
+
+	/**
+	 * @typedef {object} Props
+	 * @property {string} id
+	 * @property {number} version
+	 * @property {string} source
+	 * @property {boolean} [compact=false]
+	 */
+
+	/**  @type {Props}*/
+	const { id, version, source, compact } = $props();
+
+	/**
+	 * Change value to force re-rendering of the component, and thus re-evaluate the upgrade availability
+	 */
+	let checkagain = $state(0);
+</script>
+
+{#if version && source}
+	{#key checkagain}
+		{#await hasUpgradeAvailable({ id, version, source })}
+			<ButtonSecondary disabled onclick={() => {}}>
+				<IconCheckAgain />
+				{#if !compact}
+					Mettre à jour
+				{:else}
+					v…
+				{/if}
+			</ButtonSecondary>
+		{:then { upToDate, newVersion }}
+			{#if upToDate}
+				<ButtonSecondary
+					help="Cliquer pour vérifier à nouveau"
+					onclick={() => {
+						checkagain = Date.now();
+					}}
+				>
+					<span class="version-check up-to-date">
+						<IconUpToDate />
+						{#if !compact}
+							À jour
+						{/if}
+					</span>
+					<span>
+						v{version}
+					</span>
+				</ButtonSecondary>
+			{:else}
+				<ButtonSecondary
+					onclick={async () => {
+						await upgradeProtocol({ version, source, id })
+							.then(({ version }) => {
+								toasts.success(`Protocole mis à jour vers la v${version}`);
+							})
+							.catch((e) => {
+								toasts.error(`Impossible de mettre à jour le protocole: ${e}`);
+							});
+					}}
+					help={`Une mise à jour vers la v${newVersion} est disponible`}
+				>
+					<IconUpgrade />
+					<span class="version-check update-available">
+						{#if !compact}
+							v{version}
+							<IconArrow />
+						{/if}
+						v{newVersion}
+					</span>
+				</ButtonSecondary>
+			{/if}
+		{:catch e}
+			<ButtonSecondary
+				onclick={() => {
+					checkagain = Date.now();
+				}}
+				help={`Impossible de vérifier les mises à jour: ${e}`}
+			>
+				<span class="version-check error">
+					<IconCannotCheckForUpdates />
+					{#if !compact}
+						Rééssayer
+					{:else}
+						v?
+					{/if}
+				</span>
+			</ButtonSecondary>
+		{/await}
+	{/key}
+{:else if version}
+	<ButtonSecondary
+		onclick={() => {}}
+		help="Ce protocole ne supporte pas la vérification des mises à jour"
+	>
+		<span class="version-check">
+			<IconCannotCheckForUpdates />
+			v{version}
+		</span>
+	</ButtonSecondary>
+{:else}
+	<ButtonSecondary
+		onclick={() => {}}
+		help="Ce protocole n'est pas versionné, pour le mettre à jour, supprimer le et importez la nouvelle version"
+	>
+		<span class="version-check error">
+			<IconCannotCheckForUpdates />
+			v--
+		</span>
+	</ButtonSecondary>
+{/if}
+
+<style>
+	.version-check.error {
+		color: var(--fg-error);
+	}
+
+	.version-check.up-to-date {
+		color: var(--fg-success);
+	}
+
+	.version-check.update-available {
+		color: var(--fg-warning);
+	}
+
+	.version-check {
+		display: flex;
+		align-items: center;
+		gap: 0.5em;
+	}
+</style>
diff --git a/src/lib/exif.test.js b/src/lib/exif.test.js
index 2fe38b2..10dd52c 100644
--- a/src/lib/exif.test.js
+++ b/src/lib/exif.test.js
@@ -61,7 +61,7 @@ describe('processExifData', () => {
 			metadata: ['date', 'location', 'no-exif'],
 			authors: [],
 			description: 'Test Protocol',
-			source: 'https://example.com'
+			learnMore: 'https://example.com'
 		});
 
 		await db.tables.Image.set({
diff --git a/src/lib/protocols.js b/src/lib/protocols.js
index c5ffb91..24b4911 100644
--- a/src/lib/protocols.js
+++ b/src/lib/protocols.js
@@ -1,3 +1,4 @@
+import { type } from 'arktype';
 import YAML from 'yaml';
 import { Schemas } from './database.js';
 import { downloadAsFile, stringifyWithToplevelOrdering } from './download.js';
@@ -87,7 +88,7 @@ export async function downloadProtocolTemplate(base, format) {
 	downloadProtocol(base, format, {
 		id: 'mon-protocole',
 		name: 'Mon protocole',
-		source: 'https://github.com/moi/mon-protocole',
+		learnMore: 'https://github.com/moi/mon-protocole',
 		authors: [{ name: 'Prénom Nom', email: 'prenom.nom@example.com' }],
 		description: 'Description de mon protocole',
 		metadata: {
@@ -204,3 +205,63 @@ export async function importProtocol(contents) {
 	});
 	return ExportedProtocol.assert(protocol);
 }
+
+/**
+ *
+ * @param {Pick<typeof Schemas.Protocol.infer, 'version'|'source'|'id'>} protocol
+ * @returns {Promise< { upToDate: boolean; newVersion: number }>}
+ */
+export async function hasUpgradeAvailable({ version, source, id }) {
+	if (!source) throw new Error("Le protocole n'a pas de source");
+	if (!version) throw new Error("Le protocole n'a pas de version");
+	if (!id) throw new Error("Le protocole n'a pas d'identifiant");
+	if (typeof source !== 'string')
+		throw new Error('Les requêtes HTTP ne sont pas encore supportées, utilisez une URL');
+
+	const response = await fetch(source, {
+		headers: {
+			Accept: 'application/json'
+		}
+	})
+		.then((r) => r.json())
+		.then(
+			type({
+				'version?': 'number',
+				id: 'string'
+			}).assert
+		);
+
+	if (!response.version) throw new Error("Le protocole n'a plus de version");
+	if (response.id !== id) throw new Error("Le protocole a changé d'identifiant");
+	if (response.version > version) {
+		return {
+			upToDate: false,
+			newVersion: response.version
+		};
+	}
+
+	return {
+		upToDate: true,
+		newVersion: response.version
+	};
+}
+
+/**
+ *
+ * @param {Pick<typeof Schemas.Protocol.infer, 'version'|'source'|'id'>} protocol
+ */
+export async function upgradeProtocol({ version, source, id }) {
+	if (!source) throw new Error("Le protocole n'a pas de source");
+	if (!version) throw new Error("Le protocole n'a pas de version");
+	if (!id) throw new Error("Le protocole n'a pas d'identifiant");
+	if (typeof source !== 'string')
+		throw new Error('Les requêtes HTTP ne sont pas encore supportées, utilisez une URL');
+
+	const response = await fetch(source, {
+		headers: {
+			Accept: 'application/json'
+		}
+	}).then((r) => r.text());
+
+	return importProtocol(response);
+}
diff --git a/src/lib/schemas/protocols.js b/src/lib/schemas/protocols.js
index 2f64aca..9f811ed 100644
--- a/src/lib/schemas/protocols.js
+++ b/src/lib/schemas/protocols.js
@@ -82,9 +82,15 @@ export const Protocol = type({
 	metadata: References,
 	name: ['string', '@', 'Nom du protocole'],
 	description: ['string', '@', 'Description du protocole'],
-	source: URLString.describe(
+	'learnMore?': URLString.describe(
 		"Lien vers un site où l'on peut se renseigner sur ce protocole. Cela peut aussi être simplement un lien de téléchargement direct de ce fichier"
 	),
+	'version?': ['number', '@', 'Version actuelle du protocole'],
+	'source?': HTTPRequest.describe(
+		`Requête ou URL devant mener à un fichier JSON contenant la version la plus récente du protocole. Permet de proposer des mises à jour.
+		
+		Si le champ "version" n'existe pas (que ce soit dans le protocole local ou distant), aucune mise à jour ne sera proposée.`
+	),
 	authors: type({
 		email: ['string.email', '@', 'Adresse email'],
 		name: ['string', '@', 'Prénom Nom']
diff --git a/src/routes/(app)/+layout.js b/src/routes/(app)/+layout.js
index aba5f82..3554dab 100644
--- a/src/routes/(app)/+layout.js
+++ b/src/routes/(app)/+layout.js
@@ -30,10 +30,9 @@ async function fillBuiltinData() {
 		});
 	});
 
-	const builtinProtocol = await tables.Protocol.get('io.github.cigaleapp.arthropods.transects');
+	const builtinProtocol = await tables.Protocol.get('io.github.cigaleapp.arthropods.transect');
 
-	// TODO: at some point, remove the confirmationMetadata check
-	if (!builtinProtocol || !builtinProtocol.crop?.confirmationMetadata) {
+	if (!builtinProtocol) {
 		try {
 			await fetch(
 				'https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.json'
diff --git a/src/routes/(app)/+page.svelte b/src/routes/(app)/+page.svelte
index 1dd9611..9191e03 100644
--- a/src/routes/(app)/+page.svelte
+++ b/src/routes/(app)/+page.svelte
@@ -11,6 +11,7 @@
 	import { promptAndImportProtocol } from '$lib/protocols';
 	import { toasts } from '$lib/toasts.svelte';
 	import { seo } from '$lib/seo.svelte';
+	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
 
 	seo({ title: 'Choisir un protocole' });
 
@@ -44,7 +45,8 @@
 			/>
 		</li>
 		{#each protocols as p, i (p.id)}
-			<li>
+			{@const showVersionCheck = p.version && p.source}
+			<li class:has-version-check={showVersionCheck}>
 				<button
 					data-testid={i === 0 ? 'protocol-to-choose' : undefined}
 					class:selected={p.id === currentProtocol?.id}
@@ -55,6 +57,9 @@
 				>
 					{p.name}
 				</button>
+				{#if showVersionCheck}
+					<ButtonUpdateProtocol compact {...p} />
+				{/if}
 			</li>
 		{/each}
 	</ul>
@@ -112,14 +117,32 @@
 		display: flex;
 		align-items: center;
 		gap: 0.5em;
+		width: 100%;
+	}
+
+	li.has-version-check {
+		display: grid;
+		grid-template-columns: max-content 1fr;
+	}
+
+	/* li.has-version-check :global(button:first-child) {
+		width: 75%;
 	}
 
-	button {
+	li.has-version-check :global(button:last-child) {
+		width: 25%;
+		height: 100%;
+	} */
+
+	li:not(.has-version-check) button {
+		width: 100%;
+	}
+
+	li button {
 		display: flex;
 		justify-content: center;
 		align-items: center;
 		padding: 1rem;
-		width: 100%;
 		border: 1px solid var(--gray);
 		border-radius: var(--corner-radius);
 		font-size: 1em;
diff --git a/src/routes/(app)/protocols/CardProtocol.svelte b/src/routes/(app)/protocols/CardProtocol.svelte
index 973d2c8..5bed3a7 100644
--- a/src/routes/(app)/protocols/CardProtocol.svelte
+++ b/src/routes/(app)/protocols/CardProtocol.svelte
@@ -1,29 +1,41 @@
 <script>
 	import { base } from '$app/paths';
 	import ButtonSecondary from '$lib/ButtonSecondary.svelte';
+	import ButtonUpdateProtocol from '$lib/ButtonUpdateProtocol.svelte';
 	import Card from '$lib/Card.svelte';
+	import IconDatatype from '$lib/IconDatatype.svelte';
 	import { tables } from '$lib/idb.svelte';
+	import { metadataDefinitionComparator } from '$lib/metadata';
 	import { exportProtocol } from '$lib/protocols';
 	import { toasts } from '$lib/toasts.svelte';
 	import { tooltip } from '$lib/tooltips';
-	import IconExport from '~icons/ph/share';
+	import IconArrow from '~icons/ph/arrow-right';
+	import IconForeign from '~icons/ph/diamond';
 	import IconTaxonomy from '~icons/ph/graph';
-	import IconDelete from '~icons/ph/trash';
 	import IconSource from '~icons/ph/link-simple';
-	import IconForeign from '~icons/ph/diamond';
-	import IconAuthors from '~icons/ph/users';
+	import IconClassification from '~icons/ph/list-star';
 	import IconInferred from '~icons/ph/magic-wand';
+	import IconDetection from '~icons/ph/magnifying-glass';
+	import IconExport from '~icons/ph/share';
 	import IconTag from '~icons/ph/tag';
+	import IconDelete from '~icons/ph/trash';
+	import IconAuthors from '~icons/ph/users';
 	import IconTechnical from '~icons/ph/wrench';
-	import IconClassification from '~icons/ph/list-star';
-	import IconArrow from '~icons/ph/arrow-right';
-	import IconDetection from '~icons/ph/magnifying-glass';
-	import IconDatatype from '$lib/IconDatatype.svelte';
-	import { metadataDefinitionComparator } from '$lib/metadata';
 
 	/** @type {import('$lib/database').Protocol & { ondelete: () => void }} */
-	const { id, name, source, authors, metadata, description, ondelete, crop, metadataOrder } =
-		$props();
+	const {
+		id,
+		name,
+		learnMore,
+		source,
+		version,
+		authors,
+		metadata,
+		description,
+		ondelete,
+		crop,
+		metadataOrder
+	} = $props();
 
 	const metadataOfProtocol = $derived(
 		tables.Metadata.state
@@ -61,15 +73,17 @@
 
 <Card>
 	<header>
-		<h2>{name}</h2>
+		<h2>
+			{name}
+		</h2>
 		<code class="id">{id}</code>
 		<p class="description">
 			{description}
 		</p>
-		{#if source}
+		{#if learnMore}
 			<p class="source">
 				<IconSource />
-				<a href={source}>{source.replace('https://', '')}</a>
+				<a href={learnMore}>{learnMore.replace('https://', '')}</a>
 			</p>
 		{/if}
 		{#if authors.length}
@@ -232,6 +246,8 @@
 			<IconDelete />
 			Supprimer
 		</ButtonSecondary>
+
+		<ButtonUpdateProtocol {version} {source} {id} />
 	</section>
 </Card>
```