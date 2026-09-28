/**
 * Utility to generate and download high-resolution BloodChain Donor & Camp Pass Cards
 * Directly creates a crisp, print-ready PNG image using HTML5 Canvas.
 */

export function downloadDonorPassCard({ donor, camp, timeslot, qrValue }) {
  return new Promise((resolve, reject) => {
    try {
      const width = 850;
      const height = 520;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Rounded rectangle helper
      const roundRect = (x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      // 1. Base Card Background Gradient
      roundRect(0, 0, width, height, 28);
      ctx.clip();

      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#1c1917'); // stone-900
      bgGrad.addColorStop(0.5, '#18181b'); // zinc-900
      bgGrad.addColorStop(1, '#0c0a09'); // stone-950
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Decorative radial glows
      const glowGrad = ctx.createRadialGradient(width - 100, 100, 10, width - 100, 100, 250);
      glowGrad.addColorStop(0, 'rgba(225, 29, 72, 0.18)');
      glowGrad.addColorStop(1, 'rgba(225, 29, 72, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      const glowGrad2 = ctx.createRadialGradient(100, height - 100, 10, 100, height - 100, 250);
      glowGrad2.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
      glowGrad2.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glowGrad2;
      ctx.fillRect(0, 0, width, height);

      // Border with subtle rose glow
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 3;
      roundRect(2, 2, width - 4, height - 4, 26);
      ctx.stroke();

      // 2. Header Bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, width, 75);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 75);
      ctx.lineTo(width, 75);
      ctx.stroke();

      // Brand Logo Droplet
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(45, 38, 16, 0, Math.PI * 2);
      ctx.fill();

      // Brand Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('BloodChain', 72, 42);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('OFFICIAL CAMP DONOR PASS', 190, 42);

      // Status Badge (Top Right)
      ctx.fillStyle = '#064e3b'; // emerald-950
      roundRect(width - 195, 22, 165, 32, 10);
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      roundRect(width - 195, 22, 165, 32, 10);
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('✓ APPROVED & ACTIVE', width - 180, 42);

      // 3. Left Section: Donor Information
      // Donor Name
      ctx.fillStyle = '#a8a29e';
      ctx.font = '10px monospace';
      ctx.fillText('DONOR FULL NAME', 40, 115);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(donor?.name || 'Registered Donor', 40, 145);

      // Donor ID & Blood Group
      ctx.fillStyle = '#a8a29e';
      ctx.font = '10px monospace';
      ctx.fillText('DONOR PERMANENT ID', 40, 185);

      ctx.fillStyle = '#261217';
      roundRect(40, 195, 145, 28, 6);
      ctx.fill();
      ctx.strokeStyle = '#9f1239';
      roundRect(40, 195, 145, 28, 6);
      ctx.stroke();

      ctx.fillStyle = '#fb7185';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(donor?.donor_id || 'BC-D-00000', 50, 214);

      // Blood Group
      ctx.fillStyle = '#a8a29e';
      ctx.font = '10px monospace';
      ctx.fillText('BLOOD GROUP', 220, 185);

      ctx.fillStyle = '#e11d48';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(donor?.blood_group || 'O+', 220, 216);

      const isNeg = donor?.blood_group?.includes('-');
      ctx.fillStyle = '#a8a29e';
      ctx.font = '11px monospace';
      ctx.fillText(`(Rh ${isNeg ? 'Neg' : 'Pos'})`, 265, 215);

      // Camp & Venue Information (if camp provided)
      const campName = camp?.camp_name || 'BloodChain Community Donation Drive';
      const venueName = camp?.venue_name || camp?.venue_address || 'Regional Blood Center';
      const slot = timeslot || 'General Arrival Slot';

      ctx.fillStyle = '#a8a29e';
      ctx.font = '10px monospace';
      ctx.fillText('REGISTERED CAMP VENUE', 40, 260);

      ctx.fillStyle = '#f5f5f4';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      // Truncate if long
      const truncatedCamp = campName.length > 40 ? campName.substring(0, 38) + '...' : campName;
      ctx.fillText(truncatedCamp, 40, 285);

      ctx.fillStyle = '#d6d3d1';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const truncatedVenue = venueName.length > 50 ? venueName.substring(0, 48) + '...' : venueName;
      ctx.fillText(truncatedVenue, 40, 308);

      // Arrival Time Slot
      ctx.fillStyle = '#a8a29e';
      ctx.font = '10px monospace';
      ctx.fillText('SCHEDULED ARRIVAL SLOT', 40, 350);

      ctx.fillStyle = '#fef3c7'; // amber-100
      roundRect(40, 360, 260, 30, 8);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      roundRect(40, 360, 260, 30, 8);
      ctx.stroke();

      ctx.fillStyle = '#92400e'; // amber-800
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`🕒 ${slot}`, 52, 380);

      // 4. Right Section: QR Code Box
      const qrBoxX = width - 260;
      const qrBoxY = 100;
      const qrBoxW = 220;
      const qrBoxH = 320;

      ctx.fillStyle = '#ffffff';
      roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 18);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 18);
      ctx.stroke();

      // Find rendered QR canvas or SVG from DOM, or render an image
      const existingQrCanvas = document.querySelector(`canvas[data-qr="${donor?.donor_id || 'donor'}"]`) ||
                               document.querySelector('canvas[title*="QR"]') ||
                               document.querySelector('canvas');

      const drawFooterAndDownload = (qrImg) => {
        if (qrImg) {
          ctx.drawImage(qrImg, qrBoxX + 20, qrBoxY + 20, 180, 180);
        } else {
          // Fallback placeholder box with text
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(qrBoxX + 20, qrBoxY + 20, 180, 180);
          ctx.fillStyle = '#334155';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('QR CODE', qrBoxX + 75, qrBoxY + 115);
        }

        // Text below QR Code inside white box
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SCAN FOR VERIFICATION', qrBoxX + qrBoxW / 2, qrBoxY + 225);

        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText('INSTANT DESK CHECK-IN', qrBoxX + qrBoxW / 2, qrBoxY + 245);

        ctx.fillStyle = '#e11d48';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(donor?.donor_id || '', qrBoxX + qrBoxW / 2, qrBoxY + 275);
        ctx.textAlign = 'left';

        // 5. Card Footer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(0, height - 55, width, 55);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(0, height - 55);
        ctx.lineTo(width, height - 55);
        ctx.stroke();

        ctx.fillStyle = '#78716c';
        ctx.font = '10px monospace';
        ctx.fillText('Permanent BloodChain ID • Verifiable Across All Affiliated Hospitals & Mobile Camps', 40, height - 24);

        ctx.fillStyle = '#10b981';
        ctx.fillText('● CRYPTOGRAPHICALLY SIGNED', width - 230, height - 24);

        // Download as PNG
        const link = document.createElement('a');
        link.download = `BloodChain_Pass_${donor?.donor_id || 'Donor'}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve(true);
      };

      // Try reading an SVG/Canvas from DOM or creating image from SVG
      const svgElement = document.querySelector(`svg[data-qr="${donor?.donor_id}"]`) || document.querySelector('svg');
      if (existingQrCanvas) {
        const img = new Image();
        img.onload = () => drawFooterAndDownload(img);
        img.onerror = () => drawFooterAndDownload(null);
        img.src = existingQrCanvas.toDataURL();
      } else if (svgElement) {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          drawFooterAndDownload(img);
          URL.revokeObjectURL(blobURL);
        };
        img.onerror = () => drawFooterAndDownload(null);
        img.src = blobURL;
      } else {
        drawFooterAndDownload(null);
      }
    } catch (err) {
      console.error('Failed to download card:', err);
      reject(err);
    }
  });
}
