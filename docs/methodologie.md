# Méthode de sélection des annonces

## Critères obligatoires

- Achat d'une **maison située à Antony (92160)**, pas dans une commune voisine.
- Au moins **100 m² habitables** annoncés : ne pas additionner terrain, garage, sous-sol ou surface utile à la surface habitable.
- Au moins **3 chambres existantes** : un nombre de pièces n'est pas un nombre de chambres ; un bureau ou une chambre à créer ne suffit pas.
- Un **sous-sol privatif explicitement mentionné** dans l'annonce. Un parking souterrain collectif ou la seule mention d'une cave ne suffit pas.
- Un prix affiché **strictement inférieur à 750 000 €**. Une annonce à 750 000 € est exclue. Ce seuil ne constitue pas un budget « tout compris » : frais d'acquisition et travaux éventuels restent à évaluer.

Le mode achat est l'hypothèse retenue pour cette première version. Le moteur peut restreindre cette sélection, jamais élargir les critères obligatoires.

## Collecte et vérification

1. Découvrir des annonces sur le Web puis ouvrir chaque fiche individuelle.
2. Relever le prix, la surface habitable et le nombre de chambres sur la fiche, pas uniquement dans un extrait de moteur de recherche.
3. Conserver un très court extrait établissant la présence du sous-sol, le lien source et la date de consultation.
4. Écarter les annonces explicitement vendues, retirées, hors périmètre ou dont un critère obligatoire reste indémontrable.
5. Rechercher les doublons par référence, URL et caractéristiques (surface, chambres, prix, quartier). Un même bien peut être diffusé par plusieurs agences ; le dédoublonnage ne peut pas être garanti sans adresse exacte.
6. Ne publier que des faits utiles à la comparaison et une synthèse originale. Les textes intégraux, photographies, coordonnées personnelles et archives de collecte ne sont pas publiés.
7. Valider le jeu JSON et exécuter les tests avant publication.

## Ce que signifie la date de vérification

La date indique la consultation de la fiche source, **pas une confirmation de disponibilité par le vendeur**, ni la date de publication de l'annonce. Une fiche accessible ne garantit pas que le bien est encore disponible. Le prix, l'état du bien, le DPE et la surface doivent être confirmés auprès du professionnel ; la visite et les documents du bien restent indispensables.

La sélection est **manuelle, datée et non exhaustive**. Le site GitHub Pages filtre les annonces déjà recensées ; il n'interroge pas les portails immobiliers en temps réel. Il ne comporte pas de mise à jour automatique ni d'alerte programmée. Actualiser la page recharge le jeu de données publié, pas les fiches des agences.

## Actualiser la sélection

Modifier `data/listings.json` après une nouvelle consultation des sources. Une simple ouverture de l'application ne doit jamais faire avancer `checkedAt` ou `meta.updatedAt`. Retirer une fiche vendue ou invalidée ; ne pas déduire « vendu » d'une erreur réseau ou d'un blocage temporaire. Exécuter `npm test` et `npm run build`, puis proposer les changements par pull request. Le workflow publie la branche `main` après validation.

## Vie privée et droits

Les favoris restent dans le stockage local du navigateur et ne sont pas envoyés à un serveur applicatif. GitHub Pages reste l'hébergeur et applique ses propres règles de journalisation. Aucun formulaire de contact, compte utilisateur ou traceur publicitaire n'est ajouté. Les sources conservent leurs droits sur leurs annonces ; la licence du code ne confère aucun droit de réutilisation de leur contenu.
