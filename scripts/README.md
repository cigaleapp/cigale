Scripts pour diverses tâches du projet, notamment la génération de la définition du protocole d'exemple, chargé par défaut dans l'appli.

## Protocoles: arthropods.example

Généré:

- en scrappant le site de [Jessica Joachim](https://jessica-joachim.com/) (avec son autorisation) pour la plupart des images et descriptions d'espèces: voir [`jessica-joachim-scraper.js`](./jessica-joachim-crawler.js)
- en transformant des Google Slides réalisées par Léo Chekir, sourçant l'INPN, la LMDI ainsi que diverses photographes , en images et descriptions d'espèces additionnelles: voir [`add-species-from-google-slides.js`](./add-species-from-google-slides.js)
- depuis GBIF (à faire, cf [#189](https://github.com/cigaleapp/cigale/issues/189))

Ces diverses scripts sont lancés chaque semaine par [un workflow Github Actions](https://github.com/cigaleapp/cigale/actions/workflows/regen-arthropods-protocol.yml)
