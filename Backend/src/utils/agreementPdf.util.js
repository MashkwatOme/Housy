/**
 * @file src/utils/agreementPdf.util.js
 * @description Generates the final, black-and-white Housy tenancy agreement.
 */
const PDFDocument = require("pdfkit")
const axios = require("axios")
const path = require("path")

const PAGE = { width: 595.28, height: 841.89, marginX: 52, contentWidth: 491.28, top: 82, bottom: 54 }

async function fetchImageBuffer(url) {
    if (!url) return null
    try {
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 10000,
            maxContentLength: 5 * 1024 * 1024,
        })
        return Buffer.from(response.data)
    } catch (error) {
        console.warn("Unable to embed agreement signature image:", error.message)
        return null
    }
}

function safeText(value, fallback = "Not provided") {
    return value === null || value === undefined || value === "" ? fallback : String(value)
}

function parseRules(value) {
    if (Array.isArray(value)) return value.filter(Boolean)
    if (!value) return []
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch (error) {
        return []
    }
}

function formatDate(value, includeTime = false) {
    if (!value) return "Not provided"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Not provided"
    const options = includeTime
        ? { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka", timeZoneName: "short" }
        : { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Dhaka" }
    return new Intl.DateTimeFormat("en-GB", options).format(date)
}

function formatCurrency(value) {
    const amount = Number(value)
    if (!Number.isFinite(amount)) return "Not provided"
    return `BDT ${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
}

function calculateTerm(startValue, endValue) {
    const start = new Date(startValue)
    const end = new Date(endValue)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return "Not specified"
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    if (days >= 365 && days % 365 < 16) {
        const years = Math.round(days / 365)
        return `${years} year${years === 1 ? "" : "s"}`
    }
    if (days >= 28) {
        const months = Math.round(days / 30.4375)
        return `${months} month${months === 1 ? "" : "s"}`
    }
    return `${days} day${days === 1 ? "" : "s"}`
}

function documentIdFor(draft) {
    const source = safeText(draft.id, "UNKNOWN").replace(/[^a-zA-Z0-9]/g, "")
    return `HOU-AGR-${source.slice(0, 12).toUpperCase()}`
}

function drawHeader(doc) {
    doc.save()
    doc.rect(0, 0, PAGE.width, 42).fill("#000000")
    doc.fillColor("#FFFFFF").font("HousyBold").fontSize(13).text("HOUSY", PAGE.marginX, 15, { lineBreak: false })
    doc.font("HousyRegular").fontSize(8.5).text("RESIDENTIAL TENANCY AGREEMENT", PAGE.width - PAGE.marginX - 190, 17, { width: 190, align: "right", lineBreak: false })
    doc.restore()
}

function drawFooter(doc, docId, pageNumber) {
    const y = PAGE.height - 34
    const originalBottomMargin = doc.page.margins.bottom
    doc.page.margins.bottom = 0
    doc.save()
    doc.strokeColor("#000000").lineWidth(0.6).moveTo(PAGE.marginX, y - 8).lineTo(PAGE.width - PAGE.marginX, y - 8).stroke()
    doc.fillColor("#000000").font("HousyRegular").fontSize(7.5)
        .text(`Agreement ID: ${docId}`, PAGE.marginX, y, { width: 340, lineBreak: false })
        .text(`Page ${pageNumber}`, PAGE.width - PAGE.marginX - 80, y, { width: 80, align: "right", lineBreak: false })
    doc.restore()
    doc.page.margins.bottom = originalBottomMargin
}

function installPageLayout(doc, docId) {
    let pageNumber = 0
    const decorate = () => {
        pageNumber += 1
        drawHeader(doc)
        drawFooter(doc, docId, pageNumber)
        doc.x = PAGE.marginX
        doc.y = PAGE.top
    }
    doc.on("pageAdded", decorate)
    decorate()
}

function ensureSpace(doc, requiredHeight) {
    if (doc.y + requiredHeight > PAGE.height - PAGE.bottom) doc.addPage()
}

function sectionTitle(doc, title) {
    ensureSpace(doc, 32)
    doc.fillColor("#000000").font("HousyBold").fontSize(13).text(title, PAGE.marginX, doc.y)
    doc.moveDown(0.45)
}

function drawTable(doc, rows, columnWidths, options = {}) {
    const paddingX = 7
    const paddingY = 6
    const fontSize = options.fontSize || 8.8
    const boldFirstColumn = options.boldFirstColumn !== false

    rows.forEach((row, rowIndex) => {
        const isHeader = options.headerRows && rowIndex < options.headerRows
        const heights = row.map((cell, columnIndex) => {
            const font = isHeader || (boldFirstColumn && columnIndex === 0) ? "HousyBold" : "HousyRegular"
            doc.font(font).fontSize(fontSize)
            return doc.heightOfString(safeText(cell, ""), { width: columnWidths[columnIndex] - paddingX * 2, lineGap: 1 })
        })
        const rowHeight = Math.max(options.minimumRowHeight || 28, ...heights.map((height) => height + paddingY * 2))
        ensureSpace(doc, rowHeight + 2)
        const y = doc.y
        let currentX = PAGE.marginX

        row.forEach((cell, columnIndex) => {
            const width = columnWidths[columnIndex]
            doc.save()
            if (isHeader && options.blackHeader) {
                doc.rect(currentX, y, width, rowHeight).fillAndStroke("#000000", "#000000")
                doc.fillColor("#FFFFFF")
            } else {
                doc.rect(currentX, y, width, rowHeight).fillAndStroke("#FFFFFF", "#000000")
                doc.fillColor("#000000")
            }
            const font = isHeader || (boldFirstColumn && columnIndex === 0) ? "HousyBold" : "HousyRegular"
            doc.font(font).fontSize(fontSize).text(safeText(cell, ""), currentX + paddingX, y + paddingY, { width: width - paddingX * 2, lineGap: 1 })
            doc.restore()
            currentX += width
        })
        doc.y = y + rowHeight
    })
    doc.moveDown(0.8)
}

function paragraph(doc, text, options = {}) {
    const fontSize = options.fontSize || 9
    const width = options.width || PAGE.contentWidth
    doc.font(options.bold ? "HousyBold" : "HousyRegular").fontSize(fontSize).fillColor("#000000")
    const height = doc.heightOfString(text, { width, align: options.align || "left", lineGap: 2 })
    ensureSpace(doc, height + (options.after || 8))
    doc.text(text, PAGE.marginX, doc.y, { width, align: options.align || "left", lineGap: 2 })
    doc.y += options.after || 8
}

function drawSignatureBox(doc, label, signerName, signatureBuffer, signedAt, x, width) {
    const y = doc.y
    const height = 142
    doc.rect(x, y, width, height).stroke("#000000")
    doc.font("HousyBold").fontSize(8.5).fillColor("#000000").text(label, x + 7, y + 7, { width: width - 14 })
    doc.font("HousyRegular").fontSize(8.5).text(safeText(signerName), x + 7, y + 23, { width: width - 14 })
    if (signatureBuffer) {
        try {
            doc.image(signatureBuffer, x + 10, y + 43, { fit: [width - 20, 55], align: "center", valign: "center" })
        } catch (error) {
            doc.font("HousyRegular").fontSize(8).text("Electronic signature recorded", x + 10, y + 68, { width: width - 20, align: "center" })
        }
    } else {
        doc.font("HousyRegular").fontSize(8).text("Electronic signature recorded", x + 10, y + 68, { width: width - 20, align: "center" })
    }
    doc.moveTo(x + 18, y + 105).lineTo(x + width - 18, y + 105).stroke("#000000")
    doc.font("HousyRegular").fontSize(7.6).text(`Signed electronically: ${formatDate(signedAt, true)}`, x + 7, y + 114, { width: width - 14 })
}

async function buildAgreementPdfBuffer(draft) {
    const [tenantSignatureBuffer, ownerSignatureBuffer] = await Promise.all([
        fetchImageBuffer(draft.tenant_signature),
        fetchImageBuffer(draft.owner_signature),
    ])
    const docId = documentIdFor(draft)
    const customRules = parseRules(draft.custom_rules)

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: "A4",
            margins: { top: PAGE.top, right: PAGE.marginX, bottom: PAGE.bottom, left: PAGE.marginX },
            info: { Title: `Housy Residential Tenancy Agreement - ${docId}`, Author: "Housy", Subject: "Final signed residential tenancy agreement" },
            bufferPages: true,
        })
        const chunks = []
        doc.registerFont("HousyRegular", path.join(__dirname, "../assets/fonts/DejaVuSans.ttf"))
        doc.registerFont("HousyBold", path.join(__dirname, "../assets/fonts/DejaVuSans-Bold.ttf"))
        doc.on("data", (chunk) => chunks.push(chunk))
        doc.on("end", () => resolve(Buffer.concat(chunks)))
        doc.on("error", reject)
        installPageLayout(doc, docId)

        doc.font("HousyBold").fontSize(22).fillColor("#000000").text("Residential Tenancy Agreement", PAGE.marginX, PAGE.top, { width: 335 })
        doc.rect(PAGE.width - PAGE.marginX - 118, PAGE.top + 2, 118, 30).stroke("#000000")
        doc.font("HousyBold").fontSize(8.5).text("STATUS: FULLY SIGNED", PAGE.width - PAGE.marginX - 112, PAGE.top + 13, { width: 106, align: "center", lineBreak: false })
        doc.y = 135

        drawTable(doc, [
            ["AGREEMENT ID", "START DATE", "MONTHLY RENT", "TERM"],
            [docId, formatDate(draft.agreement_start_date), formatCurrency(draft.monthly_rent), calculateTerm(draft.agreement_start_date, draft.agreement_end_date)],
        ], [150, 116, 116, 109], { headerRows: 1, minimumRowHeight: 31, boldFirstColumn: false, fontSize: 8 })

        sectionTitle(doc, "1. Parties")
        drawTable(doc, [
            ["Property Owner", `Name: ${safeText(draft.owner_name)}\nOwner ID: ${safeText(draft.owner_id)}\nEmail: ${safeText(draft.owner_email)}\nPhone: ${safeText(draft.owner_phone)}`],
            ["Tenant", `Name: ${safeText(draft.tenant_name)}\nTenant ID: ${safeText(draft.tenant_id)}\nEmail: ${safeText(draft.tenant_email)}\nPhone: ${safeText(draft.tenant_phone)}`],
        ], [128, 363], { minimumRowHeight: 60 })

        sectionTitle(doc, "2. Property")
        drawTable(doc, [
            ["Rental Premises", `${safeText(draft.property_title)}\n${safeText(draft.property_address)}`],
            ["Property Details", `${safeText(draft.property_type)}; ${safeText(draft.property_bedrooms)} bedroom(s); ${safeText(draft.property_bathrooms)} bathroom(s); ${safeText(draft.property_size)} sq. ft.`],
            ["Agreement Type", safeText(draft.agreement_type || draft.property_listing_type)],
        ], [128, 363], { minimumRowHeight: 34 })

        sectionTitle(doc, "3. Financial Terms")
        drawTable(doc, [
            ["ITEM", "AMOUNT / TIMING", "CONDITION"],
            ["Monthly rent", formatCurrency(draft.monthly_rent), "Payable according to the agreed monthly schedule"],
            ["Security deposit", formatCurrency(draft.security_deposit), "Subject to the refund and deduction terms in this agreement"],
            ["Utilities", "As applicable", "Responsibility determined by the agreed clauses and property terms"],
        ], [120, 130, 241], { headerRows: 1, blackHeader: true, minimumRowHeight: 31 })

        sectionTitle(doc, "4. Term")
        paragraph(doc, `The tenancy begins on ${formatDate(draft.agreement_start_date)} and ends on ${formatDate(draft.agreement_end_date)}, unless renewed or terminated in accordance with this agreement and applicable law.`, { after: 10 })

        doc.addPage()
        sectionTitle(doc, "5. Terms and Conditions")
        const clauses = Array.isArray(draft.clauses) ? draft.clauses : []
        if (clauses.length) {
            clauses.forEach((clause, index) => {
                const title = safeText(clause.clause_title || clause.clause_category, `Clause ${index + 1}`)
                paragraph(doc, `${index + 1}. ${title}`, { bold: true, after: 2 })
                paragraph(doc, safeText(clause.clause_content), { align: "justify", after: 8 })
            })
        } else {
            paragraph(doc, "No standard clauses were recorded for this agreement.")
        }

        sectionTitle(doc, "6. Special Conditions")
        if (customRules.length) customRules.forEach((rule, index) => paragraph(doc, `${index + 1}. ${safeText(rule)}`, { after: 5 }))
        else paragraph(doc, "No additional custom conditions were recorded.")

        if (draft.negotiation_notes) {
            sectionTitle(doc, "7. Agreed Negotiation Notes")
            paragraph(doc, safeText(draft.negotiation_notes), { align: "justify" })
        }

        sectionTitle(doc, "8. Acknowledgement and Electronic Signatures")
        paragraph(doc, "Each party confirms that they reviewed the complete agreement, had an opportunity to ask questions, accepted the recorded terms and clauses, and applied the electronic signature shown below.", { align: "justify", after: 10 })
        ensureSpace(doc, 152)
        const signatureY = doc.y
        drawSignatureBox(doc, "OWNER SIGNATURE", draft.owner_name, ownerSignatureBuffer, draft.owner_signed_at, PAGE.marginX, 238)
        doc.y = signatureY
        drawSignatureBox(doc, "TENANT SIGNATURE", draft.tenant_name, tenantSignatureBuffer, draft.tenant_signed_at, PAGE.marginX + 253, 238)
        doc.y = signatureY + 152

        ensureSpace(doc, 132)
        sectionTitle(doc, "9. Document Verification")
        drawTable(doc, [
            ["Agreement status", "Fully signed"],
            ["Verification reference", docId],
            ["Generated", formatDate(new Date(), true)],
        ], [150, 341], { minimumRowHeight: 28 })

        ensureSpace(doc, 550)
        sectionTitle(doc, "10. Legal Notice and Housy Support")
        paragraph(doc, "This Rental Agreement has been prepared in accordance with the applicable laws and regulations of Bangladesh, including the House Rent Control Act, 1991, the Transfer of Property Act, 1882, the Contract Act, 1872, and other applicable laws relating to tenancy and leases. The terms and conditions contained herein are intended to record the mutual agreement between the Landlord and the Tenant and shall be interpreted subject to the applicable laws of Bangladesh.", { align: "justify", after: 12 })
        paragraph(doc, "This Rental Agreement has been generated electronically through the Housy digital rental platform based on information and terms provided by the Landlord and the Tenant. Housy provides both parties with platform-based assistance regarding legal and procedural issues connected with the preparation, execution, interpretation, performance, and enforcement of this agreement, including guidance on available next steps and access to appropriate legal-support channels.", { align: "justify", after: 12 })
        paragraph(doc, "Housy accepts responsibility and liability for its own acts, omissions, representations, platform services, and contractual obligations relating to this agreement, to the extent provided in Housy's applicable terms of service and required by the laws of Bangladesh. Housy will provide reasonable assistance to both the Landlord and the Tenant when a legal issue or dispute arises in connection with the agreement. Nothing in this clause excludes or limits any responsibility or liability that cannot lawfully be excluded or limited. The parties may also obtain independent legal advice, particularly for registration, formal dispute resolution, or court proceedings.", { align: "justify", after: 20 })

        sectionTitle(doc, "This Document is legalized by")
        const legalY = doc.y
        doc.rect(PAGE.marginX, legalY, PAGE.contentWidth, 190).stroke("#000000")
        doc.moveTo(PAGE.marginX + 70, legalY + 83).lineTo(PAGE.width - PAGE.marginX - 70, legalY + 83).stroke("#000000")
        doc.font("HousyRegular").fontSize(8).text("Authorized name / organization", PAGE.marginX + 12, legalY + 91)
        doc.moveTo(PAGE.marginX + 70, legalY + 145).lineTo(PAGE.width - PAGE.marginX - 70, legalY + 145).stroke("#000000")
        doc.text("Signature, seal and date", PAGE.marginX + 12, legalY + 153)
        doc.end()
    })
}

module.exports = { buildAgreementPdfBuffer, documentIdFor }
