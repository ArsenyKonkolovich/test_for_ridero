import axios from "axios"
import AdmZip from "adm-zip"
import fs from "fs"

const fileUrl =
  "https://drive.google.com/u/0/uc?id=1Ve8-MjYpSKVIa7NqWpKJ1Oc85PSZTvZ0&export=download"

const zipPath = "test"

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

const unzipAndSaveFiles = (zipBuffer) => {
  const zip = new AdmZip(zipBuffer)
  zip.extractAllTo("test", true)
  console.log('Файл распакован в "test"')
}

const downloadZipAndConvertToPDF = async (link) => {
  await downloadZip(link).then((zipBuffer) => {
    unzipAndSaveFiles(zipBuffer, zipPath)
  })
}

downloadZipAndConvertToPDF(fileUrl)
