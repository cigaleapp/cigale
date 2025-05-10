Scripts pour diverses tâches du projet, notamment la génération de la définition du protocole d'exemple, chargé par défaut dans l'appli.

## Protocoles: arthropods.example

Généré ainsi:

1. [`generate-protocol.js`](./generate-protocol.js): Génération du protocole de base, la plupart des métadonnées ont des listes d'options vides. La liste des espèces est initialisée depuis le _classmapping_ du réseau neuronal de classification. Toutes les descriptions, images, liens etc. sont vides.
2. [`add-species-from-jessica-joachim.js`](./add-species-from-jessica-joachim.js): Ajout de descriptions, images et liens pour les espèces depuis [le site de Jessica Joachim](https://jessica-joachim.com)
3. [`add-species-from-google-slides.js`](./add-species-from-google-slides.js): Ajout de descriptions, images, liens et potentiellement de nouvelles espèces, depuis des Google Slides d'un dossier Google Drive partagé avec des collaborateurices.
4. [`add-taxonomic-parents-from-gbif.js`](./add-taxonomic-parents-from-gbif.js): Ajout des données hiérarchiques pour l'inférence taxonomique, et remplissage des listes d'options pour les métadonnées de clades supérieures (ordre, famille, genre, etc) depuis [GBIF](https://gbif.org/). Il remplit aussi les liens, descriptions et images pour les espèces qui n'en aurait toujours pas eu après les étapes précédentes.

Ces divers scripts sont lancés chaque semaine par [un workflow Github Actions](https://github.com/cigaleapp/cigale/actions/workflows/regen-arthropods-protocol.yml)
