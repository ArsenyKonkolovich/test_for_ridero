import axios from "axios"
import AdmZip from "adm-zip"
import puppeteer from "puppeteer"
import fsp from "node:fs/promises"
import path from "path"

const fileUrl =
  "https://drive.google.com/u/0/uc?id=1BWtmpFv997xXbKouqCRgoSX5-THEsxrt&export=download"

const pathForExtract = "test"

const downloadZip = async (link) => {
  const response = await axios.head(link)

  if (response.status === 200) {
    const contentLength = response.headers["content-length"]

    if (contentLength > 2147483648) {
      throw new Error("Вес файла больше 2-х гигов")
    }

    console.log(`Размер файла: ${contentLength} байт`)

    const fileResponse = await axios.get(link, {
      responseType: "arraybuffer",
    })

    return Buffer.from(fileResponse.data)
  }
}

const unzipAndSaveFiles = (zipBuffer, pathForExtract) => {
  const zip = new AdmZip(zipBuffer)
  zip.extractAllTo(pathForExtract, true)
  console.log(`Файл распакован в ${pathForExtract}`)
}

const readAndConvertToPDF = async (pathForExtract) => {
  const fileList = await fsp.readdir(pathForExtract)
  const htmlFileName = fileList.find((el) => path.extname(el) == ".html")
  const htmlContent = await fsp.readFile(
    path.join(process.cwd(), pathForExtract, htmlFileName),
    "utf-8"
  )

  console.log(htmlContent)

  const browser = await puppeteer.launch({
    headless: "new",
  })
  const page = await browser.newPage()

  await page.setContent(htmlContent)

  const pdfOptions = {
    path: "output.pdf",
    format: "A4",
  }

  await page.pdf(pdfOptions)

  await browser.close()
}

const downloadZipAndConvertToPDF = async (link) => {
  await downloadZip(link)
    .then((zipBuffer) => {
      unzipAndSaveFiles(zipBuffer, pathForExtract)
    })
    .then(() => {
      readAndConvertToPDF(pathForExtract)
    })
}

downloadZipAndConvertToPDF(fileUrl)
