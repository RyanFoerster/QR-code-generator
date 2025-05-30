# 👁️ Guide - Prévisualisation QR Code

## 📋 Nouvelle fonctionnalité ajoutée

### ✅ **Prévisualisation en temps réel**

- **QR code factice** : Template généré en SVG (pas un vrai QR code)
- **Mise à jour instantanée** : Couleurs et styles changent en temps réel
- **Aperçu fidèle** : Montre exactement le rendu final

## 🎨 **Fonctionnalités de la prévisualisation**

### **QR Code factice** :

- **Pattern réaliste** : 21x21 modules comme un vrai QR code version 1
- **Généré en SVG** : Qualité vectorielle parfaite
- **Couleurs personnalisées** : Reflète les choix de l'utilisateur
- **Fond transparent** : Gestion du motif damier

### **Interface** :

- **Titre** : "👁️ Aperçu du QR Code" avec badge "🎨 Prévisualisation"
- **Container adaptatif** : Fond blanc ou transparent avec damier
- **Informations** : Couleurs actuelles affichées en temps réel
- **Animations** : Transitions fluides lors des changements

## 🔄 **Comportement**

### **État initial** :

- **Prévisualisation visible** par défaut
- **Couleurs par défaut** : QR noir (#000000) sur fond blanc (#FFFFFF)
- **Mise à jour automatique** quand l'utilisateur change les couleurs

### **Changement de couleurs** :

1. **Utilisateur modifie** la couleur QR ou fond
2. **Prévisualisation se met à jour** instantanément
3. **Animation subtile** de transition (scale + opacity)
4. **Informations mises à jour** en bas de l'aperçu

### **Génération réelle** :

1. **Utilisateur confirme** la génération
2. **Prévisualisation disparaît** avec animation
3. **QR code réel apparaît** à la place
4. **Bouton reset** ramène à la prévisualisation

## 🎯 **Avantages utilisateur**

### **Avant génération** :

- ✅ **Voir le rendu** avant de consommer sa limite
- ✅ **Tester les couleurs** sans conséquences
- ✅ **Ajuster le style** jusqu'à satisfaction
- ✅ **Éviter les erreurs** de couleurs illisibles

### **Expérience améliorée** :

- ✅ **Feedback visuel immédiat** sur les choix
- ✅ **Confiance** dans le résultat final
- ✅ **Moins de regrets** après génération
- ✅ **Interface plus engageante**

## 🧪 **Comment tester**

### **Test 1 : Prévisualisation par défaut**

1. **Chargez la page** dashboard
2. **Observez** la prévisualisation avec QR noir sur fond blanc
3. **Vérifiez** les informations de couleur en bas

### **Test 2 : Changement de couleurs**

1. **Modifiez la couleur QR** (ex: rouge #FF0000)
2. **Observez** la mise à jour instantanée
3. **Modifiez la couleur de fond** (ex: bleu #0000FF)
4. **Vérifiez** que tout se met à jour

### **Test 3 : Fond transparent**

1. **Cochez "Fond transparent"**
2. **Observez** le motif damier qui apparaît
3. **Vérifiez** que l'info affiche "Transparent"

### **Test 4 : Génération réelle**

1. **Remplissez le formulaire** (IBAN, montant)
2. **Confirmez la génération**
3. **Observez** la transition vers le QR réel
4. **Cliquez Reset** pour revenir à la prévisualisation

## 🔍 **Détails techniques**

### **Pattern QR factice** :

```javascript
// Exemple de pattern (21x21 modules)
const pattern = [
  "111111101011001111111", // Ligne 1
  "100000101110101000001", // Ligne 2
  // ... 19 autres lignes
];
```

### **Génération SVG** :

- **Modules** : Rectangles de 11x11 pixels
- **Couleur dynamique** : Appliquée via l'attribut `fill`
- **Taille totale** : 231x231 pixels (21 × 11)

### **Gestion du fond transparent** :

```css
/* Motif damier pour visualiser la transparence */
background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), ...;
background-size: 12px 12px;
```

## 🎨 **Styles et animations**

### **Container** :

- **Glassmorphism** : `bg-white/10 backdrop-blur-sm`
- **Bordures arrondies** : `rounded-2xl`
- **Padding adaptatif** : `p-4 sm:p-6 lg:p-8`

### **QR Code** :

- **Taille responsive** : `w-48 h-48 sm:w-56 sm:h-56`
- **Centré** : `mx-auto`
- **SVG vectoriel** : Qualité parfaite à toutes les tailles

### **Animations** :

- **Mise à jour** : Scale 0.95→1.0 + opacity 0.7→1.0
- **Durée** : 200ms pour fluidité
- **Transition** : Prévisualisation ↔ QR réel (300ms)

## 🚀 **Flux d'utilisation**

1. **Utilisateur arrive** → Voit la prévisualisation
2. **Ajuste les couleurs** → Prévisualisation se met à jour
3. **Satisfait du rendu** → Remplit le formulaire
4. **Génère le QR** → Transition vers le vrai QR code
5. **Veut recommencer** → Reset ramène à la prévisualisation

## 💡 **Conseils d'utilisation**

### **Pour l'utilisateur** :

- 🎨 **Testez les couleurs** avant de générer
- 👁️ **Vérifiez la lisibilité** (contraste suffisant)
- 🔄 **Utilisez Reset** pour revenir à la prévisualisation
- ⚠️ **Attention** : La prévisualisation n'est qu'un aperçu visuel

### **Bonnes pratiques couleurs** :

- ✅ **Contraste élevé** : QR foncé sur fond clair
- ✅ **Éviter** : Couleurs trop similaires
- ✅ **Tester** : Vérifier la scannabilité du vrai QR

---

**🎉 Résultat** : Les utilisateurs peuvent maintenant voir exactement à quoi ressemblera leur QR code avant de le générer, évitant les mauvaises surprises et optimisant leur expérience !
