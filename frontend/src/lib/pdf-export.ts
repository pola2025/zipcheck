import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Export a DOM element to PDF (A4, multi-page support)
 */
export async function exportToPdf(element: HTMLElement, filename: string): Promise<void> {
	const canvas = await html2canvas(element, {
		scale: 2,
		useCORS: true,
		logging: false,
		backgroundColor: '#ffffff',
	})

	const imgData = canvas.toDataURL('image/png')
	const imgWidth = 210 // A4 width in mm
	const pageHeight = 297 // A4 height in mm
	const imgHeight = (canvas.height * imgWidth) / canvas.width

	const pdf = new jsPDF('p', 'mm', 'a4')
	let heightLeft = imgHeight
	let position = 0

	// First page
	pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
	heightLeft -= pageHeight

	// Additional pages if needed
	while (heightLeft > 0) {
		position = -(pageHeight - (heightLeft > 0 ? 0 : heightLeft + pageHeight))
		pdf.addPage()
		pdf.addImage(imgData, 'PNG', 0, position - (imgHeight - heightLeft - pageHeight), imgWidth, imgHeight)
		heightLeft -= pageHeight
	}

	pdf.save(`${filename}.pdf`)
}
