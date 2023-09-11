import axios from "axios"
import AdmZip from "adm-zip"
import puppeteer from "puppeteer"
import fsp from "node:fs/promises"
import path from "path"
import { logStep, logError } from "../logger/logger.js"
import { processHtml, isZip } from "./utils.js"

export default async (link) => {
  const startTime = process.hrtime()
  const startMemoryUsage = process.memoryUsage()

  let htmlFileName

  try {
    const zipBuffer = await downloadZip(link)
    const extractedFiles = await unzipAndSaveFiles(zipBuffer)
    htmlFileName = await readAndConvertToPDF(extractedFiles)

    const endTime = process.hrtime(startTime)
    const memoryUsage = process.memoryUsage(startMemoryUsage)

    logStep("Название, время, память", endTime, memoryUsage, htmlFileName[0])
  } catch (error) {
    logError(error, link)
    throw error
  }
  return htmlFileName
}

const downloadZip = (link) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.head(link)

      if (response.status === 200) {
        const contentLength = response.headers["content-length"]
        const contentDisposition = response.headers["content-disposition"]

        if (!isZip(contentDisposition)) {
          throw new Error("Это не zip файл")
        }

        if (contentLength > 2147483648) {
          throw new Error("Вес файла больше 2-х гигов")
        }

        console.log(`Размер файла: ${contentLength} байт`)

        const fileResponse = await axios.get(link, {
          responseType: "arraybuffer",
        })

        resolve(Buffer.from(fileResponse.data))
      }
    } catch (error) {
      reject(new Error(`"Ошибка скачивания" ${error}`))
    }
  })
}

const unzipAndSaveFiles = (zipBuffer) => {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip(zipBuffer)
      const zipEntries = zip.getEntries()
      let pathForExtract
      zipEntries.forEach((zipEntry) => {
        const entryName = zipEntry.entryName
        if (path.extname(entryName) == ".html") {
          pathForExtract = path.basename(entryName, ".html")
        }
      })
      zip.extractAllTo(pathForExtract, true)
      resolve(pathForExtract)
    } catch (error) {
      reject(`Не удалось разархивировать ${error}`)
    }
  })
}

const readAndConvertToPDF = async (pathForExtract) => {
  const fileList = await fsp.readdir(pathForExtract)
  const resoursesFolderPath = path.join(`./${pathForExtract}/${fileList[1]}`)
  const resoursesFileList = await fsp.readdir(resoursesFolderPath)
  const htmlFileName = fileList.find((el) => path.extname(el) == ".html")

  const htmlContent = await fsp.readFile(
    path.join(process.cwd(), pathForExtract, htmlFileName),
    "utf-8"
  )
  const cssFileName = resoursesFileList.find((el) => path.extname(el) == ".css")
  const cssFilePath = path.join(resoursesFolderPath, cssFileName)

  const browser = await puppeteer.launch({
    headless: "new",
  })
  const page = await browser.newPage()

  const pdfPath = `${path.basename(htmlFileName, ".html")}.pdf`

  await processHtml(htmlContent, pathForExtract)
    .then(async (modifiedHtml) => {
      await page.setContent(modifiedHtml)

      await page.addStyleTag({ path: cssFilePath })

      const pdfOptions = {
        path: pdfPath,
        format: "A4",
      }

      await page.pdf(pdfOptions)

      await browser.close()

      await fsp.rm(pathForExtract, { recursive: true })
    })
    .catch((e) => {
      throw new Error(e)
    })

  return [htmlFileName, pdfPath]
}
