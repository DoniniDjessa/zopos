# Receipt Printing Setup Guide

This document explains how to properly set up receipt printing to avoid blank spaces and unwanted elements (buttons, navigation, etc.) in the printed output.

## Overview

The receipt system uses a thermal receipt printer format (80mm width) with carefully configured CSS to ensure clean printing without blank spaces or UI elements.

## Key Implementation Strategies

### 1. **Use a Separate Print Window**

Always open the receipt in a new window using `window.open()`. This isolates the receipt from the main application UI.

```typescript
const printWindow = window.open('', '_blank', 'width=300,height=600')
if (printWindow) {
  printWindow.document.write(receiptHTML)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
```

**Why this works:**
- Creates a clean slate without any parent page elements
- Prevents navigation bars, headers, and footers from appearing
- Gives full control over what gets printed

### 2. **Critical CSS Configuration**

#### A. Page Size and Margins

```css
@page {
  size: 80mm auto;  /* Width fixed, height automatic */
  margin: 0;        /* Remove browser default margins */
}
```

#### B. Body Styling

```css
body {
  font-family: 'Courier New', 'Courier', monospace;
  font-size: 12px;
  line-height: 1.3;
  padding: 10px 12px 30px 12px;  /* Controlled padding */
  max-width: 80mm;                 /* Match paper width */
  margin: 0 auto;                  /* Center content */
  color: #000000;                  /* Black text for printing */
  background: #ffffff;             /* White background */
}
```

**Key points:**
- `margin: 0` on `@page` removes browser margins
- `padding` on `body` gives controlled spacing
- `max-width: 80mm` ensures content doesn't exceed paper width
- `margin: 0 auto` centers the receipt

#### C. Print Media Query

```css
@media print {
  body { 
    padding: 10px; 
    margin: 0;
  }
  .no-print {
    display: none;  /* Hide any UI elements */
  }
}
```

### 3. **Box-Sizing Reset**

```css
* { 
  margin: 0; 
  padding: 0; 
  box-sizing: border-box; 
}
```

This ensures consistent sizing calculations and prevents unexpected spacing.

### 4. **Avoiding Blank Spaces**

#### Problem Areas and Solutions:

1. **Top/Bottom Blank Spaces:**
   - Remove default margins with `margin: 0` on `@page`
   - Use controlled padding only on body

2. **Side Margins:**
   - Set `margin: 0` on `@page`
   - Use `max-width: 80mm` to constrain content
   - Center with `margin: 0 auto` on body

3. **Element Spacing:**
   - Use consistent margin/padding values
   - Border-bottom with dashed lines instead of large margins
   ```css
   .section { 
     margin-bottom: 8px; 
     padding-bottom: 6px; 
     border-bottom: 2px dashed #9ca3af; 
   }
   ```

4. **Footer Spacing:**
   ```css
   .footer { 
     padding-bottom: 40px;  /* Extra space for printer cutter */
   }
   ```

### 5. **Hiding Unwanted Elements**

#### Method 1: Separate Window (Recommended)
Generate complete HTML in a new window - nothing from the main app will appear.

#### Method 2: CSS Classes
Add `.no-print` class to any elements that shouldn't print:

```css
@media print {
  .no-print {
    display: none;
  }
}
```

Apply to buttons, navigation, etc.:
```html
<Button className="no-print">Close</Button>
```

### 6. **Complete HTML Structure**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reçu de Vente</title>
  <style>
    /* All CSS inline in the head */
  </style>
</head>
<body>
  <!-- Receipt content only - no buttons, no navigation -->
  <div class="header">...</div>
  <div class="section">...</div>
  <div class="footer">...</div>
</body>
</html>
```

## Common Issues and Solutions

### Issue 1: Buttons Appear in Print
**Solution:** Use separate print window OR add `.no-print` class with `display: none` in print media query.

### Issue 2: Large Top Margin
**Solution:** Set `margin: 0` on `@page` directive and control spacing with body padding.

### Issue 3: Content Cut Off
**Solution:** 
- Ensure `max-width: 80mm` matches paper size
- Use `auto` height on `@page`
- Add sufficient padding-bottom to footer

### Issue 4: Blank Pages After Receipt
**Solution:** 
- Don't use `page-break-after`
- Keep footer padding reasonable (40px max)
- Use `size: 80mm auto` for automatic height

### Issue 5: Text Too Light
**Solution:** Use `color: #000000` explicitly throughout, avoid gray colors.

## Typography Best Practices

```css
/* Main heading */
.header h1 { 
  font-size: 14px; 
  font-weight: 600; 
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #000000;
}

/* Section titles */
.section-title {
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Body text */
body {
  font-size: 12px;
  line-height: 1.3;
}

/* Small details */
.item-details { 
  font-size: 9px; 
}
```

## Printing Timing

```typescript
const printWindow = window.open('', '_blank', 'width=300,height=600')
if (printWindow) {
  printWindow.document.write(receiptHTML)
  printWindow.document.close()
  
  // Wait for window to load
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 100)
  }
  
  // Backup timeout
  setTimeout(() => {
    if (printWindow.document.readyState === 'complete') {
      printWindow.focus()
      printWindow.print()
    }
  }, 500)
}
```

**Why multiple timeouts?**
- Ensures images and fonts load completely
- `onload` catches most cases
- Backup timeout for slower systems

## Images in Receipts

```css
.header .logo {
  max-width: 60px;
  max-height: 60px;
  margin: 0 auto 6px;
  display: block;
  filter: contrast(1.2) brightness(0.8);  /* Enhance for thermal printers */
}
```

```html
<img src="/cbmin.png" alt="Logo" class="logo" />
```

**Tips:**
- Use absolute paths starting with `/`
- Keep images small (60px max)
- Use `filter` to enhance contrast for thermal printers

## Essential Checklist

When implementing receipts in a new app:

- [ ] Set `@page { size: 80mm auto; margin: 0; }`
- [ ] Reset all margins/padding with `* { margin: 0; padding: 0; box-sizing: border-box; }`
- [ ] Use `window.open()` for isolated print window
- [ ] Add `@media print` to hide UI elements
- [ ] Use `color: #000000` for all text
- [ ] Set explicit `font-family: 'Courier New', 'Courier', monospace`
- [ ] Add controlled spacing with margin/padding on individual sections
- [ ] Include loading timeouts before `window.print()`
- [ ] Add extra footer padding (40px) for printer cutter
- [ ] Test on actual thermal printer, not just PDF preview

## Complete Example

See implementation in:
- [app/admin/pos/page.tsx](../app/admin/pos/page.tsx#L730-L980) - Main POS receipt generation
- [app/admin/pending-receipts/page.tsx](../app/admin/pending-receipts/page.tsx#L367-L580) - Pending receipt printing

## Summary

The key to clean receipt printing:
1. **Isolation:** Use separate window
2. **Control:** Reset all default styles
3. **Precision:** Set exact measurements (80mm, specific fonts)
4. **Simplicity:** Only include receipt content, no UI elements
5. **Testing:** Always test on actual printer
