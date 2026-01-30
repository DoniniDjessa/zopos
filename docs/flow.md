🧵 Workflow UI/UX : Fashion-Tech App "Zo POS"

1. L'Identité Visuelle (Blue Edition)
   L'IA doit utiliser une palette qui évoque la technologie, la pureté des matières et le luxe moderne.

Palette de Couleurs :

Primary (Deep Navy): #0F172A — Pour l'autorité, les titres et la Bottom Bar.

Secondary (Ice Blue): #F0F9FF — Pour les fonds de section (remplace le crème).

Accent (Electric Blue): #3B82F6 — Pour les CTAs, le bouton + et les états actifs.

Neutral (Glass): rgba(255, 255, 255, 0.7) avec flou pour les headers.

Typographie :

Titres: 'Cormorant Garamond' (Serif) — Pour l'aspect "Haute Couture".

Corps/Données: 'Inter' — Pour l'aspect technique et moderne.

2. Le Mix "Organic & Tech" (Adaptation Vêtements)
   Contrairement à un site de vêtements classique, nous gardons l'aspect Analytique (Design 2) :

Côté Organique : Gros plans sur les textures (lin, coton bio, soie), ombres douces.

Côté Tech : Indicateurs de durabilité, indice de chaleur, et score de "Match" avec le style de l'utilisateur.

3. Master Prompt pour l'IA de Code (Version Mode)
   Prompt à copier : "Agis en tant que Lead Développeur Frontend. Nous créons 'Aura Blue', une plateforme e-commerce de mode haut de gamme.

1. Layout Global & Navigation :

Mobile Only Bottom Bar : Fixe, couleur #0F172A. Découpe concave au centre.

FAB Central : Bouton bleu électrique (#3B82F6) avec icône 'Sparkles' pour le 'AI Stylist'.

Desktop : Header minimaliste transparent. Ajoute un bouton 'Back to Top' circulaire bleu qui apparaît au scroll.

2. Page Boutique (Shop) :

Header : 'Affirmez votre style' (Serif).

Slider Promo : Cartes horizontales bleu ciel (#E0F2FE). Image de mannequin détourée, texte à gauche.

Filtres : Chips horizontales. Sélectionné = Bleu électrique.

Grille Produits (2 col Mobile / 4 col Desktop) :

Cartes avec border-radius: 24px.

Insights Tech : Sous le prix, affiche des micro-données : 'Durabilité : A+', 'Matière : 100% Bio', 'Fit : Ajusté'.

Action : Bouton + bleu en bas à droite de l'image.

3. Page Détail Produit :

Visuals : Image principale avec Floating Tooltips (ex: 'Coutures renforcées', 'Tissu respirant').

Dashboard de Matière : Graphiques en barres (Design 2) pour : Confort, Isolation, Flexibilité.

4. Diagnostic "AI Stylist" :

Workflow par étapes : 'Quelle est votre morphologie ?', 'Quel événement préparez-vous ?'.

Design épuré avec des transitions 'Fade-in up' utilisant Framer Motion.

Contraintes : Utilise exclusivement des variantes de Bleu et de Blanc. Les coins doivent être très arrondis (24px). Le code doit être en React/Tailwind."

4. Ce que l'IA ne doit pas manquer (Détails Experts)
   A. Le "Go To Top" Premium
   Ne fais pas juste un bouton. Demande-lui d'inclure une bordure de progression circulaire autour de la flèche qui se remplit à mesure que l'utilisateur scrolle vers le bas.

B. Les Micro-animations
Hover sur Vêtement : L'image change pour montrer le vêtement porté (ou un zoom sur la fibre).

Bouton Panier : Lorsqu'on clique sur le +, une petite animation de particule bleue vole vers l'icône panier de la Bottom Bar.

C. Adaptation Big Device (Desktop)
L'IA doit transformer la grille de 2 colonnes en une mise en page "Masonry" ou une grille de 4 colonnes très aérée avec beaucoup d'espace blanc (Whitespace) pour garder l'aspect luxe.
