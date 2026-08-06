const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function test() {
  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const dims = [612, 792];
    const page = pdfDoc.addPage(dims);
    const form = pdfDoc.getForm();

    const addField = (
      name,
      defaultVal,
      x,
      y,
      width,
      height = 18,
      fontSize = 9
    ) => {
      const tf = form.createTextField(name);
      tf.setText(defaultVal);
      tf.addToPage(page, {
        x,
        y,
        width,
        height,
        borderWidth: 1,
        borderColor: rgb(0.78, 0.82, 0.9),
        backgroundColor: rgb(0.97, 0.98, 1),
        font,
      });
      if (fontSize) {
        tf.setFontSize(fontSize);
      }
    };

    addField('inv_title', 'COMMERCIAL INVOICE', 54, 792 - 55, 230, 26, 16);
    addField('inv_number', 'INV-2026-001', 612 - 134, 792 - 49, 80, 18);

    const savedBytes = await pdfDoc.save();
    console.log('PDF saved successfully! Bytes len:', savedBytes.length);

    const loadedDoc = await PDFDocument.load(savedBytes);
    const loadedForm = loadedDoc.getForm();
    const fields = loadedForm.getFields();
    console.log('Successfully re-loaded fields count:', fields.length);
  } catch (err) {
    console.error('CRITICAL TEMPLATE ERROR:', err);
  }
}

test();
