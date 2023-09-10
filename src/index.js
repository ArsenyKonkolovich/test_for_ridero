import axios from "axios"
import AdmZip from "adm-zip"
import puppeteer from "puppeteer"
import fsp from "node:fs/promises"
import path from "path"
import { logStep, logError } from "../logger/logger.js"
import processHtml from "./utils.js"

const fileUrl =
  "https://drive.google.com/u/0/uc?id=1yMqrPcSflqL3vaS0PwBWvc8P6PqkL9UY&export=download"

const pathForExtract = "test"

let fileName

const downloadZipAndConvertToPDF = async (link) => {
  const startTime = process.hrtime()
  const startMemoryUsage = process.memoryUsage()

  try {
    const zipBuffer = await downloadZip(link)
    await unzipAndSaveFiles(zipBuffer, pathForExtract)
    await readAndConvertToPDF(pathForExtract)

    const endTime = process.hrtime(startTime)
    const memoryUsage = process.memoryUsage(startMemoryUsage)

    logStep("Название, время, память", endTime, memoryUsage, fileName)
  } catch (error) {
    console.log(error)
    logError(error, link)
  }
}

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
  fileName = htmlFileName
  const resoursesFolderPath = path.join(`./${pathForExtract}/${zipFileList[1]}`)
  const resoursesFileList = await fsp.readdir(resoursesFolderPath)
  const cssFileName = resoursesFileList.find((el) => path.extname(el) == ".css")
  const cssFilePath = path.join(resoursesFolderPath, cssFileName)
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
      path: `${path.basename(fileName, ".html")}.pdf`,
      format: "A4",
    }

    await page.pdf(pdfOptions)

    await browser.close()
  })
}

downloadZipAndConvertToPDF(fileUrl)
