import axios from "axios"
import AdmZip from "adm-zip"
import puppeteer from "puppeteer"
import fsp from "node:fs/promises"
import path from "path"
import cheerio from "cheerio"
import logStep from "./logger.js"

const fileUrl =
  "https://drive.google.com/u/0/uc?id=1yMqrPcSflqL3vaS0PwBWvc8P6PqkL9UY&export=download"

const pathForExtract = "test"

const downloadZip = (link) => {
  return new Promise(async (resolve, reject) => {
    try {
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

        resolve(Buffer.from(fileResponse.data))
      } else {
        reject(new Error("Ошибка скачивания"))
      }
    } catch (error) {
      reject(new Error("Ссылка недоступна"))
    }
  })
}

const unzipAndSaveFiles = (zipBuffer, pathForExtract) => {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip(zipBuffer)
      zip.extractAllTo(pathForExtract, true)
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

const readAndConvertToPDF = async (pathForExtract) => {
  const zipFileList = await fsp.readdir(pathForExtract)
  const htmlFileName = zipFileList.find((el) => path.extname(el) == ".html")
  const resoursesFileList = await fsp.readdir(
    `./${pathForExtract}/${zipFileList[1]}`
  )
  const cssFileName = resoursesFileList.find((el) => path.extname(el) == ".css")
  const cssFilePath = path.join(
    `./${pathForExtract}/${zipFileList[1]}`,
    cssFileName
  )
  const htmlContent = await fsp.readFile(
    path.join(process.cwd(), pathForExtract, htmlFileName),
    "utf-8"
  )

  const browser = await puppeteer.launch({
    headless: "new",
  })
  const page = await browser.newPage()

  await processHtml(htmlContent, pathForExtract).then(async (modifiedHtml) => {
    await page.setContent(modifiedHtml)
    await page.addStyleTag({ path: cssFilePath })

    const pdfOptions = {
      path: "output.pdf",
      format: "A4",
    }

    await page.pdf(pdfOptions)

    await browser.close()
  })
}

const getExtension = (filename) => {
  return path.extname(filename).slice(1)
}

const processHtml = async (htmlContent, pathForExtract) => {
  const $ = cheerio.load(htmlContent)
  const imgElements = $("img")

  const imagePromises = imgElements
    .map(async (index, element) => {
      const src = $(element).attr("src")
      if (src) {
        const imagePath = path.join(pathForExtract, src)
        const imageData = await fsp.readFile(imagePath)
        const base64Image = imageData.toString("base64")

        const dataUri = `data:image/${getExtension(src)};base64,${base64Image}`

        $(element).attr("src", dataUri)
      }
    })
    .get()

  await Promise.all(imagePromises)

  const modifiedHtml = $.html()

  return modifiedHtml
}

const downloadZipAndConvertToPDF = async (link) => {
  const startTime = process.hrtime()
  const startMemoryUsage = process.memoryUsage()

  try {
    const zipBuffer = await downloadZip(link)
    await unzipAndSaveFiles(zipBuffer, pathForExtract)
    await readAndConvertToPDF(pathForExtract)

    const endTime = process.hrtime(startTime)
    const memoryUsage = process.memoryUsage(startMemoryUsage)

    console.log("Память в индексе", memoryUsage)

    logStep(
      "Общее время выполнения и потребление памяти",
      endTime,
      JSON.stringify(memoryUsage)
    )
  } catch (error) {
    console.error("Ошибка:", error)
  }
}

downloadZipAndConvertToPDF(fileUrl)
