<div align=center>
   <h1>
      <img src="./static/favicon.png" height="70">
      CIGALE
   </h1>
   <em>
			Classification Intelligente et Gestion des Arthropodes et de L'Entomofaune
   </em>
</div>

---

Une application web pour aider à la classification de photos d'arthropodes, avec recadrage et classification semi-automatique par réseaux de neurones.

Fonctionne hors-connexion (il suffit d'aller sur le site une seule fois pour qu'il soit disponible hors ligne).

## Fonctionnement

### 1. Choisissez un protocole

![](./tests/readme.spec.js-snapshots/screenshots-fr-protocol-1-chromium-win32.png)

CIGALE dispose d'un système avancé de définition de protocoles pour coller au mieux à vos besoins et à votre protocole scientifique. Un protocole de classification d'arthropodes avec informations taxonomiques et classification par espèce est fourni de base avec l'application.

### 2. Importez vos photos

![](./tests/readme.spec.js-snapshots/screenshots-fr-import-1-chromium-win32.png)

Importez vos photos, et laissez faire le réseau neuronal de détection qui va trouver un (ou plusieurs) arthropodes par photo, et définir des boîtes englobantes autour d'eux.

### 3. Confirmez les recadrages

![](./tests/readme.spec.js-snapshots/screenshots-fr-crop-1-chromium-win32.png)

L'onglet suivant permet de passer sur chaque photo afin d'ajuster les boîtes englobantes détectées par le réseau neuronal. Vous pouvez les ajuster, les supprimer ou en ajouter de nouvelles.

### 4. Classifiez et annotez les arthropodes

![](./tests/readme.spec.js-snapshots/screenshots-fr-classify-1-chromium-win32.png)

L'onglet "Classification" lance une inférence du réseau neuronal de classification, qui permet d'identifier l'espèce pour chaque boîte englobante trouvée. Vous pouvez alors confirmer ou modifier la classification, à l'aide d'image et de descriptions utiles. Pour le protocole par défaut, elles sont tirées de [les Carnets de Jessica](https://jessica-joachim.fr), [GBIF](https://gbif.org) et d'autres sources.

Les appartenances aux clades taxonomiques supérieures (genre, famille, ordre, classe, phylum, etc) sont déduites automatiquement à partir de l'espèce choisie.

### 5. Exportez vos données

![](./static/screenshot-exports-csv.png)

Enfin, il est possible d'exporter les données en .zip, avec les photos recadrées, les métadonnées (annotations) associées et (optionnellement) les photos originales.

Les métadonnées sont exportées au format CSV pour utilisation facile dans un tableur, et au format JSON pour une utilisation programmatique dans un script Python par exemple.

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
