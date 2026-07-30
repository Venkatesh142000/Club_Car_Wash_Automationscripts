import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// ─── Design tokens ──────────────────────────────────────────────────────────────
const L  = 50;   // left margin

const C = {
  primary:     '#1A237E',
  primaryDark: '#0D1B60',
  primaryMid:  '#283593',
  primaryLight:'#E8EAF6',
  accent:      '#0277BD',
  critical:    '#B71C1C',
  serious:     '#BF360C',
  moderate:    '#E65100',
  minor:       '#33691E',
  pass:        '#1B5E20',
  text:        '#212121',
  muted:       '#616161',
  border:      '#BDBDBD',
  white:       '#FFFFFF',
  bg:          '#F5F5F5',
  lightBg:     '#FAFAFA',
  criticalBg:  '#FFEBEE',
  seriousBg:   '#FBE9E7',
  moderateBg:  '#FFF3E0',
  minorBg:     '#F1F8E9',
  passBg:      '#E8F5E9',
};

const SEVERITY = {
  critical: { color: C.critical, bg: C.criticalBg, label: 'CRITICAL' },
  serious:  { color: C.serious,  bg: C.seriousBg,  label: 'SERIOUS'  },
  moderate: { color: C.moderate, bg: C.moderateBg, label: 'MODERATE' },
  minor:    { color: C.minor,    bg: C.minorBg,    label: 'MINOR'    },
};

/**
 * Generate a well-formatted PDF accessibility report from axe scan results.
 * @param {Array} scanResults - Array of { url, pageTitle, violations, passes, timestamp }
 * @param {string} outputPath - Path to save the PDF
 */
export async function generateAccessibilityPDF(scanResults, outputPath = 'accessibility-report.pdf') {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: false });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const PW  = 595;       // A4 width pt
  const PH  = 842;       // A4 height pt
  const CW  = PW - L - L; // content width = 495
  const now = new Date();

  // ─── Pre-compute stats ──────────────────────────────────────────────────────
  const safeViolations = (r) => r.violations || [];
  const safePasses     = (r) => r.passes     || [];

  const totalViolations = scanResults.reduce((s, r) => s + safeViolations(r).length, 0);
  const totalPasses     = scanResults.reduce((s, r) => s + safePasses(r).length,     0);
  const criticalCount   = scanResults.reduce((s, r) => s + safeViolations(r).filter(v => v.impact === 'critical').length, 0);
  const seriousCount    = scanResults.reduce((s, r) => s + safeViolations(r).filter(v => v.impact === 'serious').length,  0);
  const moderateCount   = scanResults.reduce((s, r) => s + safeViolations(r).filter(v => v.impact === 'moderate').length, 0);
  const minorCount      = scanResults.reduce((s, r) => s + safeViolations(r).filter(v => v.impact === 'minor').length,    0);

  // ═══════════════════════════════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════════════════════════════
  doc.addPage({ size: 'A4', margin: 50 });

  // Deep blue background for top half
  doc.rect(0, 0, PW, 300).fill(C.primaryMid);

  // Left accent stripe
  doc.rect(0, 0, 8, PH).fill(C.primaryDark);

  // White card body
  doc.rect(L, 300, CW, PH - 320).fill(C.white);
  doc.rect(L, 300, CW, PH - 320).stroke(C.border);

  // Title area (inside blue header)
  doc.fillColor(C.white).fontSize(30).font('Helvetica-Bold')
     .text('Accessibility Audit', L, 90, { width: CW, align: 'center' });
  doc.fillColor(C.white).fontSize(30).font('Helvetica-Bold')
     .text('Report', L, doc.y + 2, { width: CW, align: 'center' });

  doc.fillColor('#BBDEFB').fontSize(11).font('Helvetica')
     .text('Web Accessibility Analysis  ·  Powered by axe-core', L, doc.y + 12, { width: CW, align: 'center' });

  // Thin white divider
  doc.rect(L + 80, doc.y + 14, CW - 160, 1).fill('#90CAF9');

  doc.fillColor('#E3F2FD').fontSize(10).font('Helvetica')
     .text(`Generated: ${now.toLocaleString()}`, L, doc.y + 20, { width: CW, align: 'center' });
  doc.fillColor('#E3F2FD').fontSize(10)
     .text(`Total pages scanned: ${scanResults.length}`, L, doc.y + 4, { width: CW, align: 'center' });

  // ── Summary stat cards (on white section) ───────────────────────────────────
  const cardTop  = 324;
  const cardW    = 85;
  const cardH    = 78;
  const cardGap  = 10;
  const nCards   = 5;
  const cardsX   = L + (CW - (nCards * cardW + (nCards - 1) * cardGap)) / 2;

  const statCards = [
    { label: 'Total Issues', value: totalViolations, color: totalViolations > 0 ? C.critical : C.pass },
    { label: 'Critical',     value: criticalCount,   color: C.critical  },
    { label: 'Serious',      value: seriousCount,    color: C.serious   },
    { label: 'Moderate',     value: moderateCount,   color: C.moderate  },
    { label: 'Passes',       value: totalPasses,     color: C.pass      },
  ];

  statCards.forEach((card, i) => {
    const cx = cardsX + i * (cardW + cardGap);
    const cy = cardTop;
    doc.rect(cx, cy, cardW, cardH).fill(C.lightBg).stroke(C.border);
    doc.rect(cx, cy, cardW, 5).fill(card.color);
    doc.fillColor(card.color).fontSize(26).font('Helvetica-Bold')
       .text(String(card.value), cx, cy + 14, { width: cardW, align: 'center' });
    doc.fillColor(C.muted).fontSize(8).font('Helvetica')
       .text(card.label, cx, cy + 52, { width: cardW, align: 'center' });
  });

  // ── Severity stacked bar ────────────────────────────────────────────────────
  const barLabelY = cardTop + cardH + 28;
  doc.fillColor(C.text).fontSize(10).font('Helvetica-Bold')
     .text('Violation Severity Breakdown', L, barLabelY, { width: CW, align: 'center' });

  const barY  = barLabelY + 20;
  const barH  = 20;
  const barX  = L + 30;
  const barW  = CW - 60;

  const sevSegments = [
    { label: 'Critical', count: criticalCount, color: C.critical },
    { label: 'Serious',  count: seriousCount,  color: C.serious  },
    { label: 'Moderate', count: moderateCount, color: C.moderate },
    { label: 'Minor',    count: minorCount,    color: C.minor    },
  ];

  if (totalViolations > 0) {
    doc.rect(barX, barY, barW, barH).fill('#E0E0E0');
    let segX = barX;
    sevSegments.forEach(({ count, color }) => {
      if (count > 0) {
        const segW = Math.max(3, Math.round((count / totalViolations) * barW));
        doc.rect(segX, barY, segW, barH).fill(color);
        segX += segW;
      }
    });
  } else {
    doc.rect(barX, barY, barW, barH).fill(C.passBg);
    doc.fillColor(C.pass).fontSize(9).font('Helvetica-Bold')
       .text('No violations detected', barX, barY + 6, { width: barW, align: 'center' });
  }

  // Legend
  const legendY   = barY + barH + 10;
  const legItemW  = barW / 4;
  sevSegments.forEach(({ label, count, color }, i) => {
    const lx = barX + i * legItemW;
    doc.rect(lx, legendY, 10, 10).fill(color);
    doc.fillColor(C.text).fontSize(8).font('Helvetica')
       .text(`${label}: ${count}`, lx + 14, legendY + 1, { width: legItemW - 16 });
  });

  // Cover footer
  doc.fillColor('#90CAF9').fontSize(8).font('Helvetica')
     .text('CONFIDENTIAL  ·  Accessibility Audit Report', 0, PH - 28, { width: PW, align: 'center' });

  // ═══════════════════════════════════════════════════════════════════════════════
  // TABLE OF CONTENTS
  // ═══════════════════════════════════════════════════════════════════════════════
  doc.addPage({ size: 'A4', margin: 50 });
  _pageChrome(doc, PW, PH, C);

  let cy = 70;
  cy = _sectionBanner(doc, cy, L, CW, 'Table of Contents', C.primary, C);
  cy += 14;

  scanResults.forEach((result, i) => {
    if (cy > PH - 90) {
      _pageFooter(doc, PW, PH, L, CW, C, now);
      doc.addPage({ size: 'A4', margin: 50 });
      _pageChrome(doc, PW, PH, C);
      cy = 70;
    }

    const rowBg = i % 2 === 0 ? C.white : C.bg;
    doc.rect(L, cy, CW, 38).fill(rowBg).stroke(C.border);

    // Index badge
    doc.rect(L, cy, 28, 38).fill(C.primaryLight);
    doc.fillColor(C.primary).fontSize(11).font('Helvetica-Bold')
       .text(String(i + 1), L, cy + 12, { width: 28, align: 'center' });

    // Title + URL
    const vLen = safeViolations(result).length;
    doc.fillColor(C.text).fontSize(10).font('Helvetica-Bold')
       .text(result.pageTitle || 'Untitled', L + 34, cy + 6, { width: CW - 130 });
    doc.fillColor(C.muted).fontSize(8).font('Helvetica')
       .text(result.url || '', L + 34, cy + 22, { width: CW - 130 });

    // Issue badge
    const badgeColor = vLen > 0 ? C.critical : C.pass;
    doc.rect(L + CW - 88, cy + 10, 62, 18).fill(badgeColor);
    doc.fillColor(C.white).fontSize(8).font('Helvetica-Bold')
       .text(`${vLen} issue${vLen !== 1 ? 's' : ''}`, L + CW - 88, cy + 15, { width: 62, align: 'center' });

    // Scan time
    doc.fillColor(C.muted).fontSize(7).font('Helvetica')
       .text(new Date(result.timestamp).toLocaleTimeString(), L + CW - 88, cy + 29, { width: 62, align: 'right' });

    cy += 40;
  });

  _pageFooter(doc, PW, PH, L, CW, C, now);

  // ═══════════════════════════════════════════════════════════════════════════════
  // PER-PAGE RESULT SECTIONS
  // ═══════════════════════════════════════════════════════════════════════════════
  for (const result of scanResults) {
    doc.addPage({ size: 'A4', margin: 50 });
    _pageChrome(doc, PW, PH, C);
    cy = 60;

    const vCount = safeViolations(result).length;
    const pCount = safePasses(result).length;
    const bannerColor = vCount > 0 ? C.primary : C.pass;

    // ── Page title banner ──────────────────────────────────────────────────────
    cy = _pageTitleBanner(doc, cy, L, CW, result.pageTitle || result.url || 'Untitled', bannerColor, C);

    // URL + scan time
    doc.fillColor(C.muted).fontSize(8).font('Helvetica')
       .text(`URL:     ${result.url || 'N/A'}`, L + 6, cy, { width: CW - 12 });
    cy = doc.y + 2;
    doc.fillColor(C.muted).fontSize(8)
       .text(`Scanned: ${new Date(result.timestamp).toLocaleString()}`, L + 6, cy, { width: CW - 12 });
    cy = doc.y + 14;

    // ── Mini stat cards ────────────────────────────────────────────────────────
    const miniW = 100;
    const miniH = 42;
    [
      { label: 'Violations', value: vCount, color: vCount > 0 ? C.critical : C.pass },
      { label: 'Passes',     value: pCount, color: C.pass },
    ].forEach((sc, si) => {
      const scx = L + si * (miniW + 10);
      doc.rect(scx, cy, miniW, miniH).fill(C.bg).stroke(C.border);
      doc.rect(scx, cy, miniW, 4).fill(sc.color);
      doc.fillColor(sc.color).fontSize(18).font('Helvetica-Bold')
         .text(String(sc.value), scx, cy + 10, { width: miniW, align: 'center' });
      doc.fillColor(C.muted).fontSize(7).font('Helvetica')
         .text(sc.label, scx, cy + 31, { width: miniW, align: 'center' });
    });
    cy += miniH + 18;

    // ── No violations ──────────────────────────────────────────────────────────
    if (vCount === 0) {
      doc.rect(L, cy, CW, 38).fill(C.passBg).stroke('#A5D6A7');
      doc.fillColor(C.pass).fontSize(12).font('Helvetica-Bold')
         .text('✓  No accessibility violations found on this page', L + 10, cy + 13, { width: CW - 20 });
      cy += 54;
    } else {
      // ── Violations list ──────────────────────────────────────────────────────
      cy = _sectionBanner(doc, cy, L, CW, `Violations  (${vCount} found)`, C.critical, C);
      cy += 8;

      for (const violation of safeViolations(result)) {
        const impact  = violation.impact || 'minor';
        const sev     = SEVERITY[impact] || SEVERITY.minor;
        const nodeList = violation.nodes || [];

        // Estimate card height to decide page break
        const estimatedH = 16 + 16 + (nodeList.slice(0, 3).length * 12) + 30;
        if (cy + estimatedH > PH - 80) {
          _pageFooter(doc, PW, PH, L, CW, C, now);
          doc.addPage({ size: 'A4', margin: 50 });
          _pageChrome(doc, PW, PH, C);
          cy = 60;
        }

        // Header bar  ── always saved before drawing, used for text placement
        const hdrY = cy;
        doc.rect(L, hdrY, CW, 18).fill(sev.color);
        doc.fillColor(C.white).fontSize(9).font('Helvetica-Bold')
           .text(`${sev.label}  ·  ${violation.id}`, L + 8, hdrY + 5, { width: CW - 16 });
        cy = hdrY + 18;

        // Separator
        doc.rect(L, cy, CW, 1).fill(C.border);
        cy += 6;

        // Description
        doc.fillColor(C.text).fontSize(9).font('Helvetica-Bold')
           .text('Description:', L + 10, cy, { continued: true })
           .font('Helvetica').fillColor(C.muted)
           .text(`  ${violation.description}`, { width: CW - 22 });
        cy = doc.y + 4;

        // Reference link
        doc.fillColor(C.text).fontSize(9).font('Helvetica-Bold')
           .text('Reference:', L + 10, cy, { continued: true })
           .font('Helvetica').fillColor(C.accent)
           .text(`  ${violation.helpUrl || ''}`, { width: CW - 22, link: violation.helpUrl, underline: true });
        cy = doc.y + 4;

        // Affected nodes
        if (nodeList.length > 0) {
          doc.fillColor(C.text).fontSize(8).font('Helvetica-Bold')
             .text(`Affected elements (${nodeList.length}):`, L + 10, cy);
          cy = doc.y + 2;

          nodeList.slice(0, 3).forEach((node, ni) => {
            if (cy > PH - 80) {
              _pageFooter(doc, PW, PH, L, CW, C, now);
              doc.addPage({ size: 'A4', margin: 50 });
              _pageChrome(doc, PW, PH, C);
              cy = 60;
            }
            const target = node.target?.[0] || node.html?.slice(0, 100) || 'N/A';
            doc.fillColor(C.muted).fontSize(7).font('Courier')
               .text(`  ${ni + 1}.  ${target}`, L + 18, cy, { width: CW - 36 });
            cy = doc.y + 2;
          });

          if (nodeList.length > 3) {
            doc.fillColor(C.muted).fontSize(7).font('Helvetica')
               .text(`  … and ${nodeList.length - 3} more element(s)`, L + 18, cy);
            cy = doc.y + 2;
          }
        }

        // Bottom separator
        cy += 6;
        doc.rect(L, cy, CW, 1).fill('#EEEEEE');
        cy += 10;
      }
    }

    // ── Passes summary ─────────────────────────────────────────────────────────
    if (pCount > 0) {
      if (cy > PH - 100) {
        _pageFooter(doc, PW, PH, L, CW, C, now);
        doc.addPage({ size: 'A4', margin: 50 });
        _pageChrome(doc, PW, PH, C);
        cy = 60;
      }

      cy = _sectionBanner(doc, cy, L, CW, `Passes  (${pCount} rules passed)`, C.pass, C);
      cy += 6;

      result.passes.slice(0, 15).forEach((pass, pi) => {
        if (cy > PH - 60) {
          _pageFooter(doc, PW, PH, L, CW, C, now);
          doc.addPage({ size: 'A4', margin: 50 });
          _pageChrome(doc, PW, PH, C);
          cy = 60;
        }
        doc.rect(L, cy, CW, 16).fill(pi % 2 === 0 ? C.white : C.passBg);
        doc.fillColor(C.pass).fontSize(9).font('Helvetica')
           .text(`✓  ${pass.id}: ${pass.description}`, L + 8, cy + 4, { width: CW - 16 });
        cy += 18;
      });

      if (pCount > 15) {
        doc.fillColor(C.muted).fontSize(8).font('Helvetica')
           .text(`  … and ${pCount - 15} more rules passed`, L + 8, cy);
        cy = doc.y + 4;
      }
    }

    _pageFooter(doc, PW, PH, L, CW, C, now);
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`\n[A11y] PDF report saved: ${outputPath}\n`);
      resolve(outputPath);
    });
    stream.on('error', reject);
  });
}

// ─── Private helpers ────────────────────────────────────────────────────────────

/** Draw the left accent stripe and light page background. */
function _pageChrome(doc, PW, PH, C) {
  doc.rect(0, 0, 6, PH).fill(C.primaryDark);
  doc.rect(6, 0, PW - 6, PH).fill(C.lightBg);
}

/**
 * Draw a solid colour banner with white text; return the new y after the banner.
 * Saves y BEFORE drawing the rect to avoid the doc.y offset bug.
 */
function _sectionBanner(doc, y, left, width, title, color, C) {
  const bannerH = 24;
  const textY   = y + 7;            // saved before rect draw
  doc.rect(left, y, width, bannerH).fill(color);
  doc.fillColor(C.white).fontSize(11).font('Helvetica-Bold')
     .text(title, left + 10, textY, { width: width - 20 });
  return y + bannerH + 2;
}

/**
 * Draw a taller page-title banner; return new y after.
 */
function _pageTitleBanner(doc, y, left, width, title, color, C) {
  const bannerH = 34;
  const textY   = y + 10;           // saved before rect draw
  doc.rect(left, y, width, bannerH).fill(color);
  doc.fillColor(C.white).fontSize(14).font('Helvetica-Bold')
     .text(title, left + 10, textY, { width: width - 20 });
  return y + bannerH + 8;
}

/** Draw a consistent footer at the bottom of the page. */
function _pageFooter(doc, PW, PH, left, width, C, now) {
  const footerY = PH - 36;
  doc.rect(left, footerY - 4, width, 1).fill(C.border);
  doc.fillColor(C.muted).fontSize(7).font('Helvetica')
     .text(
       `Accessibility Audit Report  ·  ${now.toLocaleDateString()}  ·  Page ${doc.page.number}`,
       left, footerY, { width, align: 'center' }
     );
}
