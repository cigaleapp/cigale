<div align=center>
   <h1>
      <img src="./static/favicon.png" height="70">
      CIGALE
   </h1>
   <em>
			Classification Intelligente et Gestion des Arthropodes et de L'Entomofaune
   </em>

English · <a href="./README_FR.md">Français</a>

</div>

---

A web application to assist in classifying photos of arthropods, with cropping and semi-automatic classification via neural networks.

Works offline (just visit the site once for it to be available without an Internet connection).

## How it works

### 1. Choose a protocol

![](./tests/readme.spec.js-snapshots/screenshots-en-protocol-1-chromium-linux.png)

CIGALE has an advanced protocol definition system to best fit your needs and scientific protocol. A example protocol, to classify arthropods with taxonomic information and species classification, is provided by default with the application.

### 2. Import your photos

![](./tests/readme.spec.js-snapshots/screenshots-en-import-1-chromium-linux.png)

Import your photos, and let the detection neural network find one (or more) arthropods per photo. Define bounding boxes around them.

### 3. Confirm the bounding boxes

![](./tests/readme.spec.js-snapshots/screenshots-en-crop-1-chromium-linux.png)

The next tab allows you to go through each photo to adjust the bounding boxes detected by the neural network. You can adjust them, delete them, or add new ones.

### 4. Classify and annotate the arthropods

![](./tests/readme.spec.js-snapshots/screenshots-en-classify-1-chromium-linux.png)

The "Classification" tab launches an inference from the classification neural network, which identifies the species for each detected bounding box. You can then confirm or modify the classification using helpful images and descriptions. For the default protocol, they come from [les Carnets de Jessica](https://jessica-joachim.fr), [GBIF](https://gbif.org), and other sources.

Parent taxonomic affiliations (genus, family, order, class, phylum, etc.) are automatically deduced from the chosen species.

### 5. Export your results

![](./static/screenshot-exports-csv.png)

Finally, it is possible to export the data as a .zip file, containing the cropped photos, the associated metadata (annotations), and (optionally) the original photos.

Metadata is exported in CSV format for easy use in a spreadsheet, and in JSON format for programmatic use (in a Python script, for example).

<p align="center">
  <a href="https://www.gbif.org/species/165599324">🐞</a>
  <a href="https://www.gbif.org/species/4342">🐜</a>
  <a href="https://www.gbif.org/species/797">🦋</a>
  <a href="https://www.gbif.org/species/1718308">🦗</a>
  <a href="https://www.gbif.org/species/1341976">🐝</a>
  <a href="https://www.gbif.org/species/1496">🕷️</a>
  <a href="https://www.gbif.org/species/797">🐛</a>
  <a href="https://www.gbif.org/species/1524843">🪰</a>
  <a href="https://www.gbif.org/species/1043502">🪲</a>
</p>
