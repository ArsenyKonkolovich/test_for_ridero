import Fastify from "fastify"
import downloadZipAndConvertToPDF from "../src/index.js"

const fastify = Fastify({
  logger: true,
})

fastify.route({
  method: "POST",
  url: "/",
  handler: async (request, reply) => {
    try {
      const { url } = request.body

      const htmlFileName = await downloadZipAndConvertToPDF(url)

      return {
        success: true,
        message: `Конвертация произошла успешно, файл доступен в ${htmlFileName[1]}`,
      }
    } catch (error) {
      reply.status(500).send({ success: false, message: error })
    }
  },
})

// Запуск сервера
fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  console.log(`Сервер запущен на ${address}`)
})
