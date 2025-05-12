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

## Contributeur·ice·s

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://gwen.works/"><img src="https://avatars.githubusercontent.com/u/39094199?v=4?s=100" width="100px;" alt="Gwenn Le Bihan"/><br /><sub><b>Gwenn Le Bihan</b></sub></a><br /><a href="https://github.com/cigaleapp/cigale/commits?author=gwennlbh" title="Code">💻</a> <a href="#infra-gwennlbh" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-gwennlbh" title="Maintenance">🚧</a> <a href="#projectManagement-gwennlbh" title="Project Management">📆</a> <a href="https://github.com/cigaleapp/cigale/commits?author=gwennlbh" title="Tests">⚠️</a> <a href="#design-gwennlbh" title="Design">🎨</a> <a href="#talk-gwennlbh" title="Talks">📢</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://jessica-joachim.com/qui-suis-je/"><img src="https://i0.wp.com/jessica-joachim.com/wp-content/uploads/2023/11/cropped-Paon-du-jour-2.png?s=100" width="100px;" alt="Jessica Joachim"/><br /><sub><b>Jessica Joachim</b></sub></a><br /><a href="#content" title="Content">🖋</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/edgaremy"><img src="https://avatars.githubusercontent.com/u/83783043?v=4?s=100" width="100px;" alt="Edgar Remy"/><br /><sub><b>Edgar Remy</b></sub></a><br /><a href="https://github.com/cigaleapp/cigale/issues?q=author%3Aedgaremy" title="Bug reports">🐛</a> <a href="#userTesting-edgaremy" title="User Testing">📓</a> <a href="#data-edgaremy" title="Data">🔣</a> <a href="#ideas-edgaremy" title="Ideas, Planning, & Feedback">🤔</a> <a href="#projectManagement-edgaremy" title="Project Management">📆</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mcauchoix"><img src="https://avatars.githubusercontent.com/u/727164?v=4?s=100" width="100px;" alt="mcauchoix"/><br /><sub><b>mcauchoix</b></sub></a><br /><a href="https://github.com/cigaleapp/cigale/issues?q=author%3Amcauchoix" title="Bug reports">🐛</a> <a href="#userTesting-mcauchoix" title="User Testing">📓</a> <a href="#promotion-mcauchoix" title="Promotion">📣</a> <a href="#fundingFinding-mcauchoix" title="Funding Finding">🔍</a> <a href="#ideas-mcauchoix" title="Ideas, Planning, & Feedback">🤔</a> <a href="#content-mcauchoix" title="Content">🖋</a> <a href="#projectManagement-mcauchoix" title="Project Management">📆</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/WhiSp00n"><img src="https://avatars.githubusercontent.com/u/125924054?v=4?s=100" width="100px;" alt="whisp00n"/><br /><sub><b>whisp00n</b></sub></a><br /><a href="https://github.com/cigaleapp/cigale/commits?author=WhiSp00n" title="Code">💻</a> <a href="#design-WhiSp00n" title="Design">🎨</a> <a href="#talk-WhiSp00n" title="Talks">📢</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/CceceLaPlante"><img src="https://avatars.githubusercontent.com/u/103273947?v=4?s=100" width="100px;" alt="CeceLaPlante"/><br /><sub><b>CeceLaPlante</b></sub></a><br /><a href="https://github.com/cigaleapp/cigale/commits?author=CceceLaPlante" title="Code">💻</a> <a href="#talk-CceceLaPlante" title="Talks">📢</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/InesCharles"><img src="https://avatars.githubusercontent.com/u/128176927?v=4?s=100" width="100px;" alt="inescharles"/><br /><sub><b>inescharles</b></sub></a><br /><a href="https://github.com/cigaleapp/cigale/commits?author=InesCharles" title="Code">💻</a> <a href="#talk-InesCharles" title="Talks">📢</a> <a href="#design-InesCharles" title="Design">🎨</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/axelcarlier"><img src="https://avatars.githubusercontent.com/u/32259135?v=4?s=100" width="100px;" alt="axelcarlier"/><br /><sub><b>axelcarlier</b></sub></a><br /><a href="#projectManagement-axelcarlier" title="Project Management">📆</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
