import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const generateContractPDF = async (elementId: string, filename: string = 'Sözleşme') => {
    const element = document.getElementById(elementId)
    if (!element) {
        console.error('Print area not found:', elementId)
        throw new Error('Yazdırma alanı bulunamadı.')
    }

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        })

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        const pdfWidth = pdf.internal.pageSize.getWidth()
        const imgProps = pdf.getImageProperties(imgData)
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

        // Check if height exceeds page, if so, we might need multiple pages or just scale
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(`${filename}.pdf`)
    } catch (error) {
        console.error('PDF Generation Error:', error)
        throw new Error('PDF oluşturulurken teknik bir hata oluştu. Lütfen tekrar deneyin.')
    }
}
