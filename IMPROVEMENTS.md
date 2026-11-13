# FileJolt website refinements

This package refines the supplied v1.0.2 website while retaining the Professional Monochrome design, page structure, approved branding, product accents, and original artwork.

## Improvements

- Adjusted small-screen heading sizes, spacing, wrapping, and product-page alignment.
- Added installer and portable-download shortcuts to the Downloads page, plus product-specific release anchors.
- Added a full-size screenshot viewer with keyboard focus handling, Escape to close, and direct-image fallback when JavaScript is unavailable.
- Improved mobile navigation: Escape returns focus to the menu button, clicking outside closes it, and changing between desktop and mobile clears the open state.
- Kept mobile navigation and checksum disclosures usable without JavaScript.
- Improved checksum copying with accessible status messages, selection fallback when clipboard access fails, and stable feedback on repeated clicks.
- Improved secondary text contrast, current-page indicators, and touch targets.
- Consolidated duplicated installer styles into the shared stylesheet and versioned CSS/JavaScript URLs to refresh cached assets.
- Added missing image dimensions to reserve space while images load, a descriptive homepage title, and a noindex directive for the 404 page.

## Preserved

All 27 original image, SVG, and icon files are byte-for-byte unchanged. Existing external links, release versions, file sizes, publication dates, SHA-256 values, and publisher notices are retained from the supplied ZIP. This update does not independently reverify the hosted release binaries.

## Upload to GitHub Pages

Copy the contents of this folder into the website repository root, replacing the matching HTML, CSS, and JavaScript files. Keep the existing `assets`, `software`, `downloads`, `updates`, `about`, and `support` paths. Do not upload the enclosing folder as an extra website directory. No package installation or build step is required.

The site uses root-relative paths for `https://filejolt.github.io/`, as in the supplied package. Preview it through a local HTTP server rather than opening HTML files directly.

## Validation

- Checked all nine pages at seven frame widths from 320 to 1440 CSS pixels. No horizontal document overflow was detected.
- Verified internal links, anchor targets, local assets, unique element IDs, and one primary heading per page.
- Checked mobile menu keyboard focus and breakpoint behavior, download shortcuts, screenshot opening and Escape/focus restoration, FAQ disclosures, and navigation with JavaScript removed.
- Verified clipboard copying by pasting the result, and exercised the selection fallback with the clipboard API unavailable.
- JavaScript syntax check passed. Browser review used Chromium; other browser engines were not tested.

Temporary browser-test pages and preview configuration are excluded from this package.
