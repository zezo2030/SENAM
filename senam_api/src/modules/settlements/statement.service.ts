import { Injectable, StreamableFile, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { SettlementsService } from './settlements.service.js';

@Injectable()
export class StatementService {
  constructor(private readonly settlementsService: SettlementsService) {}

  /**
   * Streams a PDF statement for the given settlement.
   * Uses pdfkit — install with: npm install pdfkit @types/pdfkit
   */
  async streamPdf(
    settlementId: string,
    companyId: string | undefined,
    res: Response,
  ): Promise<StreamableFile> {
    const settlement = await this.settlementsService.findOne(settlementId, companyId);
    const lines = await this.settlementsService.getLines(settlementId);

    // Dynamic import of pdfkit so tests can mock it without loading the native module
    const PDFDocument = (await import('pdfkit')).default as typeof import('pdfkit');
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="settlement-${settlementId}.pdf"`,
    );

    doc.pipe(res);

    // Header
    doc.fontSize(18).text('SENAM — Settlement Statement', { align: 'center' });
    doc.moveDown();

    // Summary table
    doc.fontSize(11);
    doc.text(`Settlement ID:         ${settlement.id}`);
    doc.text(`Company ID:            ${settlement.companyId}`);
    doc.text(`Window:                ${formatDate(settlement.windowStart)} → ${formatDate(settlement.windowEnd)}`);
    doc.text(`Status:                ${settlement.status}`);
    if (settlement.payoutReference) {
      doc.text(`Payout Reference:      ${settlement.payoutReference}`);
    }
    doc.moveDown();

    doc.text(`Gross Online:          ${formatAmount(settlement.grossOnline)}`);
    doc.text(`Commission (Online):   ${formatAmount(settlement.commissionOnline)}`);
    doc.text(`Refunds in Window:     ${formatAmount(settlement.refundsInWindow)}`);
    doc.text(`Commission (COD):      ${formatAmount(settlement.commissionCod)}`);
    doc.text(`Opening Carry-Forward: ${formatAmount(settlement.openingCarryForward)}`);
    doc.moveDown();
    doc.fontSize(13).text(`Net Amount: ${formatAmount(settlement.netAmount)} QAR`, { underline: true });
    doc.moveDown();

    // Line items
    if (lines.length > 0) {
      doc.fontSize(12).text('Line Items:', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10);

      for (const line of lines) {
        const kind = String(line['kind'] ?? '');
        const amount = formatAmount(line['amount'] as string | number | bigint | null | undefined);
        const desc = String(line['description'] ?? '');
        doc.text(`  ${kind.padEnd(25)} ${amount.padStart(12)} QAR   ${desc}`);
      }
    }

    doc.end();

    return new StreamableFile(doc as unknown as import('stream').Readable);
  }
}

function formatDate(d: Date | string | undefined): string {
  if (!d) return '—';
  return new Date(d).toISOString().split('T')[0]!;
}

function formatAmount(v: string | number | bigint | null | undefined): string {
  if (v === null || v === undefined) return '0.00';
  const n = Number(BigInt(String(v)));
  return (n / 100).toFixed(2);
}
