import Fastify from "fastify"
import fastifySwagger from "@fastify/swagger"
import downloadZipAndConvertToPDF from "../src/index.js"
import schema from "./schema.js"

const fastify = Fastify({
  logger: true,
})

fastify.register(fastifySwagger, {
  exposeRoute: true,
  routePrefix: "/docs",
  swagger: {
    info: {
      title: "Pdf covert API",
      description: "Сервис для конвертации html в pdf.",
      version: "1.0.0",
    },
  },
})

fastify.route({
  schema: schema,
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

const startServer = () => {
  fastify.listen({ port: 3000 }, (err, address) => {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    console.log(`Сервер запущен на ${address}`)
  })

  fastify.swagger()
}

startServer()
