import cheerio from "cheerio"
import path from "path"
import fsp from "node:fs/promises"

const getExtension = (filename) => {
  return path.extname(filename).slice(1)
}

export default async (htmlContent, pathForExtract) => {
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
