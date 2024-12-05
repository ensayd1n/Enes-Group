import axios from 'axios';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import fs from 'fs';

dotenv.config();

export async function fetchExchangeRateData() {
    try {
        const response = await axios.get(process.env.EXCHANGE_API_URL, {
            headers: {
                'Authorization': `Bearer ${process.env.EXCHANGE_API_KEY}`
            }
        });
        
        if (!response.data || !response.data.conversion_rates) {
            throw new Error('Invalid response format from currency API');
        }

        const rates = response.data.conversion_rates;
        const selectedCurrencies = {
            USD: rates.USD,
            TRY: rates.TRY,
            EUR: rates.EUR,
            RUB: rates.RUB,
            CNY: rates.CNY
        };
        
        return selectedCurrencies;
    } catch (error) {
        console.error('Currency API request failed:', error.message);
        return null;
    }
}

export const generatePDF = (invoiceData) => {
    const {
        companyLogo, companyName, companyAddress, companyTaxNumber, companyCrsNumber,
        targetCompanyName, targetCompanyAddress, invoiceNumber, invoiceDate, products
    } = invoiceData;

    const doc = new PDFDocument({ margin: 50 });
    const filename = `invoice_${invoiceNumber}.pdf`;
    const filePath = `./pdf_output/${filename}`;
    doc.pipe(fs.createWriteStream(filePath));

    if (companyLogo) {
        doc.image(companyLogo, 50, 45, { width: 100 }).moveDown();
    }

    doc.fontSize(20).text(companyName, { align: 'center' })
       .fontSize(10).text(companyAddress, { align: 'center' })
       .text(`Vergi No: ${companyTaxNumber}`, { align: 'center' })
       .text(`CRS No: ${companyCrsNumber}`, { align: 'center' })
       .moveDown(2);

    doc.fontSize(12).text(`Fatura: ${targetCompanyName}`, { align: 'left' })
       .text(targetCompanyAddress, { align: 'left' })
       .moveDown(1)
       .text(`Fatura Numarası: ${invoiceNumber}`, { align: 'left' })
       .text(`Fatura Tarihi: ${invoiceDate}`, { align: 'left' })
       .moveDown(2);

    doc.fontSize(12).text('Ürünler', 50, doc.y).moveDown(0.5);
    doc.fontSize(10).text('Ürün Adı', 50, doc.y, { width: 200, continued: true })
       .text('Adet', 250, doc.y, { width: 90, continued: true, align: 'right' })
       .text('Fiyat', 350, doc.y, { width: 90, continued: true, align: 'right' })
       .text('Toplam', 450, doc.y, { width: 90, align: 'right' })
       .moveDown(0.5);

    let totalAmount = 0;
    products.forEach((product, i) => {
        const { name, price, quantity } = product;
        const itemTotal = price * quantity;
        totalAmount += itemTotal;

        doc.fontSize(10)
           .text(name, 50, doc.y, { width: 200, continued: true })
           .text(quantity, 250, doc.y, { width: 90, continued: true, align: 'right' })
           .text(`${price.toFixed(2)} TL`, 350, doc.y, { width: 90, continued: true, align: 'right' })
           .text(`${itemTotal.toFixed(2)} TL`, 450, doc.y, { width: 90, align: 'right' });

        if ((i + 1) % 10 === 0 && i !== products.length - 1) {
            doc.addPage();
        }
    });


    doc.moveDown(2).fontSize(12).text(`Toplam Tutar: ${totalAmount.toFixed(2)} TL`, { align: 'right' });

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i)
           .fontSize(8).text(`Sayfa ${i + 1} / ${range.count}`, 50, doc.page.height - 50, { align: 'center', width: doc.page.width - 100 });
    }

    doc.end();
    return filePath;
};
