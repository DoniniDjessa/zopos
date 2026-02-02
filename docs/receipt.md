# Receipt Drawing Guide - Les Ateliers ZO

This document describes the exact format and styling used to draw receipts in the Les Ateliers ZO application. Other applications should follow this specification to produce identical receipts.

## Overview

Receipts are rendered as HTML/CSS that can be converted to images (PNG) using html2canvas. The receipt has a clean, receipt-style monospace layout with dashed dividers between sections.

## Technical Specifications

### Export Settings (html2canvas)

When converting to image:

- **Scale**: 2 (for high-resolution output)
- **Background**: `#ffffff` (white)
- **Format**: PNG
- **Filename pattern**: `recu-{order_id_first_8_chars}.png`

### Root Container

```css
background: #ffffff
padding: 32px (8 * 4px)
font-family: monospace
color: #000000
```

## Receipt Structure

The receipt is divided into 7 main sections, each separated by dashed borders:

### 1. Header Section

**Border**: Bottom - 2px dashed #9ca3af  
**Alignment**: Center  
**Bottom padding**: 16px (pb-4)  
**Bottom margin**: 16px (mb-4)

**Content**:

```
LES ATELIERS ZO
  - Font size: 2xl (24px)
  - Font weight: Bold
  - Color: #000000
  - Margin bottom: 8px (mb-2)

+225 07 49 235 896 | +225 05 55 486 130
  - Font size: xs (12px)
  - Color: #4b5563

www.lesatelierszo.com
  - Font size: xs (12px)
  - Color: #6b7280
  - Margin top: 4px (mt-1)
```

### 2. Order Information Section

**Border**: Bottom - 1px dashed #d1d5db  
**Font size**: sm (14px)  
**Bottom margin**: 16px (mb-4)  
**Bottom padding**: 16px (pb-4)

**Content** (each line as flex justify-between):

```
N° Commande: | #{FIRST_8_CHARS_UPPERCASE}
  - Label font-weight: semibold
  - Value: Order ID first 8 characters, uppercase
  - Margin bottom: 4px (mb-1)

Date: | DD/MM/YYYY
  - Label font-weight: semibold
  - Format: French locale (2-digit day, 2-digit month, numeric year)
  - Margin bottom: 4px (mb-1)

Heure: | HH:MM
  - Label font-weight: semibold
  - Format: French locale (2-digit hour, 2-digit minute)
```

### 3. Customer Information Section

**Border**: Bottom - 1px dashed #d1d5db  
**Font size**: sm (14px)  
**Bottom margin**: 16px (mb-4)  
**Bottom padding**: 16px (pb-4)

**Content**:

```
INFORMATIONS CLIENT
  - Font weight: Bold
  - Margin bottom: 8px (mb-2)

Nom: {customerName}
  - Label font-weight: semibold
  - Margin bottom: 4px (mb-1)

Téléphone: {shipping_phone}
  - Label font-weight: semibold
  - Margin bottom: 4px (mb-1)

Adresse: {shipping_address}
  - Label font-weight: semibold
```

### 4. Items Section

**Border**: Bottom - 1px dashed #d1d5db  
**Bottom margin**: 16px (mb-4)  
**Bottom padding**: 16px (pb-4)

**Header**:

```
ARTICLES
  - Font weight: Bold
  - Font size: sm (14px)
  - Margin bottom: 12px (mb-3)
```

**Each Item** (font size: xs / 12px):

```
[Product Title]                           [Unit Price] FCFA
  - Display: flex justify-between
  - Font weight: semibold
  - Margin bottom: 4px (mb-1)

  Taille: {size} | Couleur: {color}
    - Margin left: 8px (ml-2)
    - Color: #4b5563

  Qté: {quantity}                         [Subtotal] FCFA
    - Display: flex justify-between
    - Margin left: 8px (ml-2)
    - Color: #4b5563
    - Subtotal font-weight: semibold
    - Subtotal = price × quantity

[Item spacing: 12px (mb-3) between items]
```

**Number formatting**: Use locale formatting with thousands separators (e.g., 10000 → 10 000)

### 5. Notes Section (Optional)

**Only shown if notes exist**

**Border**: Bottom - 1px dashed #d1d5db  
**Font size**: xs (12px)  
**Bottom margin**: 16px (mb-4)  
**Bottom padding**: 16px (pb-4)

**Content**:

```
NOTES
  - Font weight: Bold
  - Margin bottom: 4px (mb-1)

{notes}
  - Color: #4b5563
```

### 6. Total Section

**Border**: Bottom - 2px solid #1f2937 (NOTE: solid, not dashed)  
**Bottom margin**: 16px (mb-4)  
**Bottom padding**: 16px (pb-4)

**Content**:

```
TOTAL                                     {total} FCFA
  - Display: flex justify-between
  - Font size: lg (18px)
  - Font weight: Bold
```

### 7. Footer Section

**Alignment**: Center  
**Font size**: xs (12px)  
**Top margin**: 16px (mt-4)  
**Color**: #6b7280

**Content**:

```
Merci pour votre commande !
  - Margin bottom: 4px (mb-1)

Elle est en cours de traitement.

Vous serez livré(e) sous 1 à 3 jours ouvrés.

[Dashed divider]
  - Border top: 1px dashed #d1d5db
  - Margin top: 12px (mt-3)
  - Padding top: 12px (pt-3)

📍 Riviera CIAD après la Pharmacie des jardins d'Eden, immeuble de la Société générale, Cocody Rue F44
  - Font size: xs (12px)
  - Line height: 1.4
```

## Color Reference

| Element         | Color Code | Tailwind Class |
| --------------- | ---------- | -------------- |
| Primary text    | `#000000`  | -              |
| Secondary text  | `#4b5563`  | gray-600       |
| Tertiary text   | `#6b7280`  | gray-500       |
| Phone numbers   | `#4b5563`  | gray-600       |
| Website         | `#6b7280`  | gray-500       |
| Light dividers  | `#d1d5db`  | gray-300       |
| Medium dividers | `#9ca3af`  | gray-400       |
| Dark dividers   | `#1f2937`  | gray-800       |
| Background      | `#ffffff`  | white          |

## Typography

- **Primary Font**: Monospace (system monospace font)
- **Sizes**:
  - Header title: 2xl (24px)
  - Section totals: lg (18px)
  - Standard sections: sm (14px)
  - Item details/footer: xs (12px)

## Border Styles

| Section              | Border Style       |
| -------------------- | ------------------ |
| Header bottom        | 2px dashed #9ca3af |
| Order info bottom    | 1px dashed #d1d5db |
| Customer info bottom | 1px dashed #d1d5db |
| Items bottom         | 1px dashed #d1d5db |
| Notes bottom         | 1px dashed #d1d5db |
| Total bottom         | 2px solid #1f2937  |
| Footer address top   | 1px dashed #d1d5db |

## Data Format Requirements

### Input Data Structure

```typescript
{
  id: string;                    // Order ID (UUID or similar)
  items: Array<{
    title: string;               // Product name
    size: string;                // Size (e.g., "M", "L", "XL")
    color: string;               // Color name
    quantity: number;            // Quantity ordered
    price: number;               // Unit price in FCFA
  }>;
  total: number;                 // Total price in FCFA
  shipping_address: string;      // Full delivery address
  shipping_phone: string;        // Customer phone number
  created_at: string;            // ISO 8601 date string
  customerName: string;          // Customer full name
  notes?: string;                // Optional order notes
}
```

### Date/Time Formatting

- **Date format**: Use French locale (`fr-FR`)
  - Day: 2-digit
  - Month: 2-digit
  - Year: Numeric
  - Example: `02/02/2026`

- **Time format**: Use French locale (`fr-FR`)
  - Hour: 2-digit
  - Minute: 2-digit
  - Example: `14:30`

### Number Formatting

- Use locale-based thousand separators
- Currency: Always append ` FCFA`
- Example: `15000` → `15 000 FCFA`

## Spacing System

The receipt uses a consistent spacing system based on 4px increments:

- **mb-1**: 4px
- **mb-2**: 8px
- **mb-3**: 12px
- **mb-4**: 16px
- **p-8**: 32px
- **mt-1**: 4px
- **mt-3**: 12px
- **mt-4**: 16px
- **pb-4**: 16px
- **pt-3**: 12px
- **ml-2**: 8px

## Implementation Notes

1. **Responsive width**: The receipt is designed for a max-width of 448px (max-w-md)

2. **Text wrapping**: Product titles should wrap naturally, address text uses line-height of 1.4

3. **Escaping**: The apostrophe in "d'Eden" must be properly escaped in JSX (`d&apos;Eden`)

4. **Overflow**: The receipt container should have `overflow-y: auto` and `max-height: 90vh` to handle long orders

5. **Background overlay**: When displayed as modal, use backdrop of `rgba(0, 0, 0, 0.6)`

## Example Visual Layout

```
┌────────────────────────────────────────┐
│         LES ATELIERS ZO                │
│    +225 07... | +225 05...             │
│      www.lesatelierszo.com             │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ N° Commande:            #12345678      │
│ Date:                   02/02/2026     │
│ Heure:                  14:30          │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ INFORMATIONS CLIENT                    │
│ Nom: Jean Dupont                       │
│ Téléphone: +225 01 23 45 67 89         │
│ Adresse: Cocody, Abidjan               │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ ARTICLES                               │
│                                        │
│ T-shirt Premium          15 000 FCFA   │
│   Taille: L | Couleur: Bleu            │
│   Qté: 2                 30 000 FCFA   │
│                                        │
│ Pantalon Cargo           25 000 FCFA   │
│   Taille: M | Couleur: Noir            │
│   Qté: 1                 25 000 FCFA   │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ NOTES                                  │
│ Livraison avant 18h SVP                │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ TOTAL                    55 000 FCFA   │
├────────────────────────────────────────┤
│      Merci pour votre commande !       │
│    Elle est en cours de traitement.    │
│  Vous serez livré(e) sous 1 à 3 jours  │
│             ouvrés.                    │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ 📍 Riviera CIAD après la Pharmacie     │
│ des jardins d'Eden, immeuble de la     │
│ Société générale, Cocody Rue F44       │
└────────────────────────────────────────┘
```

## Checklist for Implementation

- [ ] Use monospace font family
- [ ] Set white background (#ffffff)
- [ ] Apply 32px padding to main container
- [ ] Implement all 7 sections in order
- [ ] Use correct border styles (dashed vs solid)
- [ ] Apply proper color codes
- [ ] Format dates in French locale (DD/MM/YYYY)
- [ ] Format times in French locale (HH:MM)
- [ ] Format numbers with thousand separators
- [ ] Always append " FCFA" to prices
- [ ] Make order ID first 8 characters uppercase
- [ ] Show notes section only if notes exist
- [ ] Use flex justify-between for aligned rows
- [ ] Set proper font sizes per section
- [ ] Apply correct spacing (margins and padding)
- [ ] Center-align header and footer
- [ ] Include location emoji (📍) in footer
- [ ] Properly escape apostrophes in HTML
- [ ] Calculate subtotals (price × quantity)
- [ ] Use scale factor of 2 when exporting to image
