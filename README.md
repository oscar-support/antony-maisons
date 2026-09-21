# Antony / maisons

Comparateur éditorial statique pour des maisons à vendre à Antony (92160). La surface principale est la comparaison : filtres à gauche, annonces alignées, favoris locaux et tableau côte à côte jusqu’à trois maisons.

## Publication

URL GitHub Pages prévue : <https://oscar-support.github.io/antony-maisons/>

Le site utilise uniquement des chemins relatifs (`./assets`, `./data`) afin de fonctionner sous le préfixe `/antony-maisons/`.

## Développer et vérifier

Prérequis : Node.js 20 ou plus récent. Il n’y a aucune dépendance runtime ni installation obligatoire.

```bash
npm test
npm run build
npm run dev
```

`npm run dev` sert le dossier `dist/` à <http://localhost:4173>. Le build exige un `data/listings.json` présent et valide, le valide avant de remplacer `dist/`, puis ne copie que `public/index.html`, les modules/CSS nécessaires et le dataset validé. Les tests, scripts, fichiers source, documents, package metadata et secrets ne sont jamais publiés dans `dist/`.

Quand les annonces réelles sont ajoutées, valider leur fichier avant publication :

```bash
npm run validate:data
```

Le validateur échoue si le JSON ne respecte pas le contrat, si une URL n’est pas un lien `https`, si des identifiants ou URLs sont dupliqués, si une date de vérification manque ou si une annonce desserre un critère immuable.

## Ajouter la sélection source

Le fichier attendu est `data/listings.json` (fourni et maintenu par l’équipe de recherche). Il ne doit contenir que des faits issus de sources consultables.

Structure minimale :

```json
{
  "meta": {
    "title": "Maisons à comparer — Antony 92160",
    "updatedAt": "2026-09-21T10:00:00.000Z",
    "criteria": {
      "city": "Antony",
      "postalCode": "92160",
      "type": "house",
      "transaction": "sale",
      "minArea": 100,
      "minBedrooms": 3,
      "basementRequired": true,
      "maxPriceExclusive": 750000
    },
    "disclaimer": "Sélection manuelle à vérifier auprès des agences."
  },
  "listings": []
}
```

Chaque entrée doit fournir :

- `id`, `title`, `city`, `postalCode`, `type`, `transaction` ;
- `price` en euros, avec au plus deux décimales et strictement inférieur à `750000` (`749999.99` est accepté, `750000` est refusé) ;
- `area` habitable en m², au moins `100`, et `bedrooms` au moins `3` — le nombre de pièces ne remplace pas les chambres ;
- `rooms` et `landArea` comme nombre ou `null`, `neighborhood`, `basement: true` ;
- `basementQuote`, extrait court et exact de la source, et `description`, texte original court en français ;
- `dpe` de `A` à `G` ou `null` — l’interface affiche explicitement « Non communiqué » ;
- `url` `https` exacte de l’annonce, `source`, `sourceRef` ou `null` ;
- `checkedAt` au format ISO, `availability: "listed"` et `notes`.

La page applique toujours les critères de base. Le budget affiché commence à `749999,99 €` et un budget saisi ne peut que resserrer, jamais élargir, la limite de `750000 €` exclusive. Les filtres de surface et de chambres suivent la même règle.

## Fonctionnement et limites

- Les favoris sont conservés uniquement dans le `localStorage` de ce navigateur. Une panne, un quota ou un JSON de stockage invalide ne bloque pas la page.
- La recherche porte sur le titre, le quartier et la description, sans sensibilité aux accents.
- La sélection est un instantané éditorial, pas une recherche exhaustive de portail immobilier.
- Les prix, l’état « encore en ligne » et les caractéristiques doivent être confirmés avec l’agence avant toute décision. La preuve de sous-sol reste un extrait de source, pas une garantie juridique ou technique.
- Aucun compte, cookie de suivi, analytics, police distante, image inventée ou script tiers n’est utilisé. Les liens d’annonces s’ouvrent dans un nouvel onglet avec `noopener noreferrer`.
- Si le fichier de données ne peut pas être chargé à l’exécution, l’interface affiche un état d’erreur explicite et ne fabrique aucune annonce ; le build refuse quant à lui un dataset absent ou invalide.

## Organisation

- `public/index.html` : structure sémantique et libellés français ;
- `src/app.js` : état, rendu DOM sûr, filtres, favoris et comparaison ;
- `src/domain.js` : critères immuables, filtrage et tri ;
- `src/validation.js` : contrat et validation des faits source ;
- `src/storage.js` : stockage résilient des favoris et sélection de comparaison ;
- `src/data.js` : chargement et validation du JSON ;
- `src/styles.css` : interface ivoire/vert forêt, responsive et respectueuse de `prefers-reduced-motion` ;
- `tests/` : tests unitaires Node intégrant des fixtures de test uniquement ;
- `scripts/build.mjs` et `scripts/validate-data.mjs` : build et validation de dataset.

## Licence

Le code de l’application est proposé sous licence MIT (voir `LICENSE`). Les textes, faits, extraits de preuve et URLs provenant des sites d’annonces restent soumis aux droits et conditions de leurs sources respectives ; la licence du code ne concède aucun droit sur ces contenus tiers.
