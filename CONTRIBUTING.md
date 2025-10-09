# Contributing to Cigale

## Pre-requisites

- [Bun](https://bun.com)

## Setup

```
git clone https://github.com/cigaleapp/cigale --single-branch
cd cigale
bun i
bun run dev
```

The `--single-branch` option reduces the amount of data downloaded, as it only fetches the `main` branch (the `gh-pages` branch is used for deployment, and is quite large)

## Conventions

- Use [Gitmoji](https://gitmoji.dev/) for commit messages (you can use `npm commit` to commit using Gitmoji conventions, or use [gitmoji-rs](https://github.com/gwennlbh/gitmoji-rs) for a faster alternative written in Rust).

## Scripts

- `bun run dev`: Start the development server
- `bun run build`: Build the application for production
- `bun run preview`: Preview the production build
- `bun run format`: Format code (pre-commit hooks should ensure you only commit formatted code, but you can run this manually)
- `bun run lintfix`: Lint code and auto-fix some errors (pre-commit hooks should ensure you only commit code that passes the linter, but you can run this manually)
- `bun run commit`: Commit using Gitmoji conventions (you can also use [gitmoji-rs](https://github.com/gwennlbh/gitmoji-rs), which is the same but way faster (written in Rust). You'll have to install it separately, though, as it's not available on NPM).

## Tables

<!-- jsonschema-tables start -->

### Image

Type: `object`

_path: #_

&#36;schema: [https://json-schema.org/draft/2020-12/schema](https://json-schema.org/draft/2020-12/schema)

**_Properties_**

- <b id="propertiesaddedat">addedAt</b> `required`
    - Type: `string`
    - <i id="propertiesaddedat">path: #/properties/addedAt</i>
    - The value must match this pattern: `^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-3])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))(T((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([,.]\d+(?!:))?)?(\17[0-5]\d([,.]\d+)?)?([Zz]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$`
- <b id="propertiesboundingboxesanalyzed">boundingBoxesAnalyzed</b> `required`
    - Type: `boolean`
    - <i id="propertiesboundingboxesanalyzed">path: #/properties/boundingBoxesAnalyzed</i>
- <b id="propertiescontenttype">contentType</b> `required`
    - Type: `string`
    - <i id="propertiescontenttype">path: #/properties/contentType</i>
    - The value must match this pattern: `\w+\/\w+`
- <b id="propertiesdimensions">dimensions</b> `required`
    - <i id="propertiesdimensions">path: #/properties/dimensions</i>
- <b id="propertiesfileid">fileId</b> `required`
    - _ID vers l'objet ImageFile associé_
    - <i id="propertiesfileid">path: #/properties/fileId</i>
- <b id="propertiesfilename">filename</b> `required`
    - Type: `string`
    - <i id="propertiesfilename">path: #/properties/filename</i>
- <b id="propertiesid">id</b> `required`
    - Type: `string`
    - <i id="propertiesid">path: #/properties/id</i>
    - The value must match this pattern: `\d+(_\d+)*`
- <b id="propertiesmetadata">metadata</b> `required`
    - Type: `object`
    - <i id="propertiesmetadata">path: #/properties/metadata</i>
    - **_Properties_**

_Generated with [OntoDevelopment/json-schema-doc-ts](https://github.com/OntoDevelopment/json-schema-doc-ts)_

### ImageFile

Type: `object`

_path: #_

&#36;schema: [https://json-schema.org/draft/2020-12/schema](https://json-schema.org/draft/2020-12/schema)

**_Properties_**

- <b id="propertiescontenttype">contentType</b> `required`
    - Type: `string`
    - <i id="propertiescontenttype">path: #/properties/contentType</i>
    - The value must match this pattern: `\w+\/\w+`
- <b id="propertiesdimensions">dimensions</b> `required`
    - <i id="propertiesdimensions">path: #/properties/dimensions</i>
- <b id="propertiesfilename">filename</b> `required`
    - Type: `string`
    - <i id="propertiesfilename">path: #/properties/filename</i>
- <b id="propertiesid">id</b> `required`
    - Type: `string`
    - <i id="propertiesid">path: #/properties/id</i>
    - The value must match this pattern: `[\w_]+`
- <b id="propertiesbytes">bytes</b> `required`
    - Type: `ArrayBuffer`

_Generated with [OntoDevelopment/json-schema-doc-ts](https://github.com/OntoDevelopment/json-schema-doc-ts)_

### ImagePreviewFile

Type: `object`

_path: #_

&#36;schema: [https://json-schema.org/draft/2020-12/schema](https://json-schema.org/draft/2020-12/schema)

**_Properties_**

- <b id="propertiescontenttype">contentType</b> `required`
    - Type: `string`
    - <i id="propertiescontenttype">path: #/properties/contentType</i>
    - The value must match this pattern: `\w+\/\w+`
- <b id="propertiesdimensions">dimensions</b> `required`
    - <i id="propertiesdimensions">path: #/properties/dimensions</i>
- <b id="propertiesfilename">filename</b> `required`
    - Type: `string`
    - <i id="propertiesfilename">path: #/properties/filename</i>
- <b id="propertiesid">id</b> `required`
    - Type: `string`
    - <i id="propertiesid">path: #/properties/id</i>
    - The value must match this pattern: `[\w_]+`

_Generated with [OntoDevelopment/json-schema-doc-ts](https://github.com/OntoDevelopment/json-schema-doc-ts)_

### Observation

Type: `object`

_path: #_

&#36;schema: [https://json-schema.org/draft/2020-12/schema](https://json-schema.org/draft/2020-12/schema)

**_Properties_**

- <b id="propertiesaddedat">addedAt</b> `required`
    - Type: `string`
    - <i id="propertiesaddedat">path: #/properties/addedAt</i>
    - The value must match this pattern: `^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-3])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))(T((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([,.]\d+(?!:))?)?(\17[0-5]\d([,.]\d+)?)?([Zz]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$`
- <b id="propertiesid">id</b> `required`
    - Type: `string`
    - <i id="propertiesid">path: #/properties/id</i>
    - The value must match this pattern: `[\w_]+`
- <b id="propertiesimages">images</b> `required`
    - Type: `array`
    - <i id="propertiesimages">path: #/properties/images</i>
        - **_Items_**
        - Type: `string`
        - <i id="propertiesimagesitems">path: #/properties/images/items</i>
        - The value must match this pattern: `[\w_]+`
- <b id="propertieslabel">label</b> `required`
    - Type: `string`
    - <i id="propertieslabel">path: #/properties/label</i>
- <b id="propertiesmetadataoverrides">metadataOverrides</b> `required`
    - Type: `object`
    - <i id="propertiesmetadataoverrides">path: #/properties/metadataOverrides</i>
    - **_Properties_**

_Generated with [OntoDevelopment/json-schema-doc-ts](https://github.com/OntoDevelopment/json-schema-doc-ts)_

### Metadata

_path: #_

&#36;schema: [https://json-schema.org/draft/2020-12/schema](https://json-schema.org/draft/2020-12/schema)

_Generated with [OntoDevelopment/json-schema-doc-ts](https://github.com/OntoDevelopment/json-schema-doc-ts)_

### MetadataOption

Type: `object`

_path: #_

&#36;schema: [https://json-schema.org/draft/2020-12/schema](https://json-schema.org/draft/2020-12/schema)

**_Properties_**

- <b id="propertiesdescription">description</b> `required`
    - _Description (optionnelle) de cette option_
    - Type: `string`
    - <i id="propertiesdescription">path: #/properties/description</i>
- <b id="propertiesid">id</b> `required`
    - _ID of the form metadata_id:key_
    - Type: `string`
    - <i id="propertiesid">path: #/properties/id</i>
    - The value must match this pattern: `\w+:\w+`
- <b id="propertieskey">key</b> `required`
    - _Identifiant unique pour cette option_
    - Type: `string`
    - <i id="propertieskey">path: #/properties/key</i>
    - The value must match this pattern: `[\w_]+`
- <b id="propertieslabel">label</b> `required`
    - _Nom de l'option, affichable dans une interface utilisateur_
    - Type: `string`
    - <i id="propertieslabel">path: #/properties/label</i>
- <b id="propertiesmetadataid">metadataId</b> `required`
    - Type: `string`
    - <i id="propertiesmetadataid">path: #/properties/metadataId</i>
    - The value must match this pattern: `[\w_]+`
- <b id="propertiescascade">cascade</b>
    - _Objet contenant pour clés des identifiants d'autres métadonnées, et pour valeurs la valeur à assigner à cette métadonnée si cette option est choisie. Le processus est récursif: Imaginons une métadonnée species ayant une option avec `{ key: "1", cascade: { genus: "2" } }`, une métadonnée genus ayant une option `{ key: "2", cascade: { family: "3" } }`. Si l'option "1" de la métadonnée species est choisie, la métadonnée genus sera définie sur l'option "2" et la métadonnée family sera à son tour définie sur l'option "3"._
    - Type: `object`
    - <i id="propertiescascade">path: #/properties/cascade</i>
    - **_Properties_**
- <b id="propertiesimage">image</b>
    - Type: `string`
    - <i id="propertiesimage">path: #/properties/image</i>
    - The value must match this pattern: `https?:\/\/.+`
- <b id="propertieslearnmore">learnMore</b>
    - _Lien pour en savoir plus sur cette option de l'énumération en particulier_
    - Type: `string`
    - <i id="propertieslearnmore">path: #/properties/learnMore</i>
    - The value must match this pattern: `https?:\/\/.+`

_Generated with [OntoDevelopment/json-schema-doc-ts](https://github.com/OntoDevelopment/json-schema-doc-ts)_

### Protocol

Type: `object`

_path: #_

&#36;schema: [https://json-schema.org/draft/2020-12/schema](https://json-schema.org/draft/2020-12/schema)

**_Properties_**

- <b id="propertiesauthors">authors</b> `required`
    - _Les auteurices ayant participé à l'élaboration du protocole_
    - Type: `array`
    - <i id="propertiesauthors">path: #/properties/authors</i>
        - **_Items_**
        - Type: `object`
        - <i id="propertiesauthorsitems">path: #/properties/authors/items</i>
        - **_Properties_**
            - <b id="propertiesauthorsitemspropertiesname">name</b> `required`
                - _Prénom Nom_
                - Type: `string`
                - <i id="propertiesauthorsitemspropertiesname">path: #/properties/authors/items/properties/name</i>
            - <b id="propertiesauthorsitemspropertiesemail">email</b>
                - _Adresse email_
                - Type: `string`
                - <i id="propertiesauthorsitemspropertiesemail">path: #/properties/authors/items/properties/email</i>
                - String format must be a "email"
                - The value must match this pattern: `^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$`
- <b id="propertiescrop">crop</b> `required`
    - _Configuration de la partie recadrage_
    - Type: `object`
    - <i id="propertiescrop">path: #/properties/crop</i>
    - **_Properties_**
        - <b id="propertiescroppropertiesmetadata">metadata</b> `required`
            - _Métadonnée associée à la boîte englobante_
            - Type: `string`
            - <i id="propertiescroppropertiesmetadata">path: #/properties/crop/properties/metadata</i>
            - The value must match this pattern: `[\w_]+`
        - <b id="propertiescroppropertiespadding">padding</b> `required`
            - _Pixels de marge à rajouter autour de la boîte englobante au moment d'exporter les images recadrées_
            - Type: `integer`
            - <i id="propertiescroppropertiespadding">path: #/properties/crop/properties/padding</i>
            - Range: &ge; 0

        - <b id="propertiescroppropertiesconfirmationmetadata">confirmationMetadata</b>
            - _Métadonnée associée au fait que la boîte englobante a été (humainement) confirmée_
            - Type: `string`
            - <i id="propertiescroppropertiesconfirmationmetadata">path: #/properties/crop/properties/confirmationMetadata</i>
            - The value must match this pattern: `[\w_]+`
        - <b id="propertiescroppropertiesinfer">infer</b>
            - _Configuration de l'inférence des boîtes englobantes_
            - Type: `array`
            - <i id="propertiescroppropertiesinfer">path: #/properties/crop/properties/infer</i>
                - **_Items_**
                - Type: `object`
                - <i id="propertiescroppropertiesinferitems">path: #/properties/crop/properties/infer/items</i>
                - **_Properties_**
                    - <b id="propertiescroppropertiesinferitemspropertiesinput">input</b> `required`
                        - _Configuration de l'entrée du modèle_
                        - Type: `object`
                        - <i id="propertiescroppropertiesinferitemspropertiesinput">path: #/properties/crop/properties/infer/items/properties/input</i>
                        - **_Properties_**
                            - <b id="propertiescroppropertiesinferitemspropertiesinputpropertiesheight">height</b> `required`
                                - _Hauteur en pixels du tenseur d'entrée du modèle_
                                - Type: `number`
                                - <i id="propertiescroppropertiesinferitemspropertiesinputpropertiesheight">path: #/properties/crop/properties/infer/items/properties/input/properties/height</i>
                                - Exclusive Range: < 1024

                            - <b id="propertiescroppropertiesinferitemspropertiesinputpropertiesnormalized">normalized</b> `required`
                                - _Si les valeurs des pixels doivent être normalisées entre 0 et 1. Sinon, elles sont entre 0 et 255_
                                - Type: `boolean`
                                - <i id="propertiescroppropertiesinferitemspropertiesinputpropertiesnormalized">path: #/properties/crop/properties/infer/items/properties/input/properties/normalized</i>
                            - <b id="propertiescroppropertiesinferitemspropertiesinputpropertieswidth">width</b> `required`
                                - _Largeur en pixels du tenseur d'entrée du modèle_
                                - Type: `number`
                                - <i id="propertiescroppropertiesinferitemspropertiesinputpropertieswidth">path: #/properties/crop/properties/infer/items/properties/input/properties/width</i>
                                - Exclusive Range: < 1024

                            - <b id="propertiescroppropertiesinferitemspropertiesinputpropertiesdisposition">disposition</b>
                                - <i id="propertiescroppropertiesinferitemspropertiesinputpropertiesdisposition">path: #/properties/crop/properties/infer/items/properties/input/properties/disposition</i>
                            - <b id="propertiescroppropertiesinferitemspropertiesinputpropertiesname">name</b>
                                - _Nom de l'input du modèle à utiliser. Par défaut, prend la première input_
                                - Type: `string`
                                - <i id="propertiescroppropertiesinferitemspropertiesinputpropertiesname">path: #/properties/crop/properties/infer/items/properties/input/properties/name</i>

                    - <b id="propertiescroppropertiesinferitemspropertiesmodel">model</b> `required`
                        - _Lien vers le modèle de détection utilisé pour inférer les boîtes englobantes. Au format ONNX (.onnx) seulement, pour le moment._
                        - <i id="propertiescroppropertiesinferitemspropertiesmodel">path: #/properties/crop/properties/infer/items/properties/model</i>
                    - <b id="propertiescroppropertiesinferitemspropertiesoutput">output</b> `required`
                        - _Forme de la sortie du modèle de classification. Par exemple, shape: [cx, cy, w, h, score, _] et normalized: true correspond à un modèle YOLO11 COCO\_
                        - Type: `object`
                        - <i id="propertiescroppropertiesinferitemspropertiesoutput">path: #/properties/crop/properties/infer/items/properties/output</i>
                        - **_Properties_**
                            - <b id="propertiescroppropertiesinferitemspropertiesoutputpropertiesnormalized">normalized</b> `required`
                                - _Si les coordonnées des boîtes englobantes sont normalisées par rapport aux dimensions de l'image_
                                - Type: `boolean`
                                - <i id="propertiescroppropertiesinferitemspropertiesoutputpropertiesnormalized">path: #/properties/crop/properties/infer/items/properties/output/properties/normalized</i>
                            - <b id="propertiescroppropertiesinferitemspropertiesoutputpropertiesshape">shape</b> `required`
                                - _Forme de sortie de chaque boîte englobante. Nécéssite obligatoirement d'avoir 'score'; 2 parmi 'cx', 'sx', 'ex', 'w'; et 2 parmi 'cy', 'sy', 'ey', 'h'. Si les boîtes contiennent d'autre valeurs, bien les mentionner avec '*', même quand c'est à la fin de la liste: cela permet de savoir quand on passe à la boîte suivante. Par exemple, [cx, cy, w, h, score, *] correspond à un modèle YOLO11 COCO_
                                - Type: `array`
                                - <i id="propertiescroppropertiesinferitemspropertiesoutputpropertiesshape">path: #/properties/crop/properties/infer/items/properties/output/properties/shape</i>
                                    - **_Items_**
                                    - <i id="propertiescroppropertiesinferitemspropertiesoutputpropertiesshapeitems">path: #/properties/crop/properties/infer/items/properties/output/properties/shape/items</i>
                            - <b id="propertiescroppropertiesinferitemspropertiesoutputpropertiesname">name</b>
                                - _Nom de l'output du modèle à utiliser. output0 par défaut_
                                - Type: `string`
                                - <i id="propertiescroppropertiesinferitemspropertiesoutputpropertiesname">path: #/properties/crop/properties/infer/items/properties/output/properties/name</i>
                    - <b id="propertiescroppropertiesinferitemspropertiesname">name</b>
                        - _Nom du réseau à afficher dans l'interface. Particulièrement utile si il y a plusieurs réseaux_
                        - Type: `string`
                        - <i id="propertiescroppropertiesinferitemspropertiesname">path: #/properties/crop/properties/infer/items/properties/name</i>

- <b id="propertiesdescription">description</b> `required`
    - _Description du protocole_
    - Type: `string`
    - <i id="propertiesdescription">path: #/properties/description</i>
- <b id="propertiesid">id</b> `required`
    - _Identifiant unique pour le protocole. On conseille de mettre une partie qui vous identifie dans cet identifiant, car il doit être globalement unique. Par exemple, mon-organisation.mon-protocole_
    - Type: `string`
    - <i id="propertiesid">path: #/properties/id</i>
    - The value must match this pattern: `[\w_]+`
- <b id="propertiesmetadata">metadata</b> `required`
    - <i id="propertiesmetadata">path: #/properties/metadata</i>
- <b id="propertiesname">name</b> `required`
    - _Nom du protocole_
    - Type: `string`
    - <i id="propertiesname">path: #/properties/name</i>
- <b id="propertiesexports">exports</b>
    - _La structure du fichier .zip d'export pour ce protocole._
    - Type: `object`
    - <i id="propertiesexports">path: #/properties/exports</i>
    - **_Properties_**
        - <b id="propertiesexportspropertiesimages">images</b> `required`
            - _Chemins où sauvegarder les images. Vous pouvez utiliser {{observation.metadata.identifiant.value}} pour insérer la valeur d'une métadonnée, {{image.filename}} pour le nom de fichier, {{observation.label}} pour le label (nom) de l'observation, et {{sequence}} pour un numéro d'image, commençant à 1. {{observation.metadata.identifiant.valueLabel}} peut être pratique pour obtenir le label associé au choix d'une métadonnée de type 'enum'. Enfin, il est possible de faire {{suffix image.filename "_exemple"}} pour ajouter "\_exemple" à la fin d'un nom de fichier, mais avant son extension (par exemple: {{suffix image.filename "_cropped"}} donnera "IMG_1245_cropped.JPEG" si l'image avait pour nom de fichier "IMG_12345.JPEG"); Vous pouvez faire {{extension image.filename}} pour avoir l'extension d'un fichier, et {{fallback image.metadata.exemple "(Inconnnu)"}} pour utiliser "(Inconnu)" si image.metadata.example n'existe pas. Ce sont enfait des templates Handlebars, en savoir plus: https://handlebarsjs.com/guide/_
            - Type: `object`
            - <i id="propertiesexportspropertiesimages">path: #/properties/exports/properties/images</i>
            - **_Properties_**
                - <b id="propertiesexportspropertiesimagespropertiescropped">cropped</b> `required`
                    - <i id="propertiesexportspropertiesimagespropertiescropped">path: #/properties/exports/properties/images/properties/cropped</i>
                - <b id="propertiesexportspropertiesimagespropertiesoriginal">original</b> `required`
                    - <i id="propertiesexportspropertiesimagespropertiesoriginal">path: #/properties/exports/properties/images/properties/original</i>
        - <b id="propertiesexportspropertiesmetadata">metadata</b> `required`
            - Type: `object`
            - <i id="propertiesexportspropertiesmetadata">path: #/properties/exports/properties/metadata</i>
            - **_Properties_**
                - <b id="propertiesexportspropertiesmetadatapropertiescsv">csv</b> `required`
                    - <i id="propertiesexportspropertiesmetadatapropertiescsv">path: #/properties/exports/properties/metadata/properties/csv</i>
                - <b id="propertiesexportspropertiesmetadatapropertiesjson">json</b> `required`
                    - <i id="propertiesexportspropertiesmetadatapropertiesjson">path: #/properties/exports/properties/metadata/properties/json</i>
- <b id="propertieslearnmore">learnMore</b>
    - _Lien vers un site où l'on peut se renseigner sur ce protocole. Cela peut aussi être simplement un lien de téléchargement direct de ce fichier_
    - Type: `string`
    - <i id="propertieslearnmore">path: #/properties/learnMore</i>
    - The value must match this pattern: `https?:\/\/.+`
- <b id="propertiesmetadataorder">metadataOrder</b>
    - _L'ordre dans lequel les métadonnées doivent être présentées dans l'interface utilisateur. Les métadonnées non listées ici seront affichées après toutes celles listées ici_
    - Type: `array`
    - <i id="propertiesmetadataorder">path: #/properties/metadataOrder</i>
        - **_Items_**
        - Type: `string`
        - <i id="propertiesmetadataorderitems">path: #/properties/metadataOrder/items</i>
        - The value must match this pattern: `[\w_]+`
- <b id="propertiessource">source</b>
    - _Requête ou URL devant mener à un fichier JSON contenant la version la plus récente du protocole. Permet de proposer des mises à jour.<br>
      Si le champ "version" n'existe pas (que ce soit dans le protocole local ou distant), aucune mise à jour ne sera proposée._
    - <i id="propertiessource">path: #/properties/source</i>
- <b id="propertiesversion">version</b>
    - _Version actuelle du protocole_
    - Type: `number`
    - <i id="propertiesversion">path: #/properties/version</i>

_Generated with [OntoDevelopment/json-schema-doc-ts](https://github.com/OntoDevelopment/json-schema-doc-ts)_

### Settings

Type: `object`

_path: #_

&#36;schema: [https://json-schema.org/draft/2020-12/schema](https://json-schema.org/draft/2020-12/schema)

**_Properties_**

- <b id="propertiescropautonext">cropAutoNext</b> `required`
    - Type: `boolean`
    - <i id="propertiescropautonext">path: #/properties/cropAutoNext</i>
- <b id="propertiesgridsize">gridSize</b> `required`
    - Type: `number`
    - <i id="propertiesgridsize">path: #/properties/gridSize</i>
- <b id="propertiesid">id</b> `required`
    - <i id="propertiesid">path: #/properties/id</i>
    - The value is restricted to the following:
        1.  _"defaults"_
        2.  _"user"_
- <b id="propertieslanguage">language</b> `required`
    - <i id="propertieslanguage">path: #/properties/language</i>
    - Constant value: _"fr"_
- <b id="propertiesprotocolmodelselections">protocolModelSelections</b> `required`
    - Type: `object`
    - <i id="propertiesprotocolmodelselections">path: #/properties/protocolModelSelections</i>
    - **_Properties_**
- <b id="propertiesprotocols">protocols</b> `required`
    - <i id="propertiesprotocols">path: #/properties/protocols</i>
- <b id="propertiesshowinputhints">showInputHints</b> `required`
    - Type: `boolean`
    - <i id="propertiesshowinputhints">path: #/properties/showInputHints</i>
- <b id="propertiesshowtechnicalmetadata">showTechnicalMetadata</b> `required`
    - Type: `boolean`
    - <i id="propertiesshowtechnicalmetadata">path: #/properties/showTechnicalMetadata</i>
- <b id="propertiestheme">theme</b> `required`
    - <i id="propertiestheme">path: #/properties/theme</i>
    - The value is restricted to the following:
        1.  _"auto"_
        2.  _"dark"_
        3.  _"light"_

_Generated with [OntoDevelopment/json-schema-doc-ts](https://github.com/OntoDevelopment/json-schema-doc-ts)_

<!-- jsonschema-tables end -->
