import Fastify from "fastify"
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import downloadZipAndConvertToPDF from "../src/index.js"
import schema from "./schema.js"

export default async function initApp() {
  const fastify = Fastify({
    logger: true,
  })

  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Convert html to pdf",
        description: "API сервиса для конвертации html в pdf",
        version: process.env.npm_package_version || "1.0.0",
      },
      tags: [
        {
          name: "HTML to PDF",
          description: "Конвертация html в pdf",
        },
      ],
      components: {},
    },
  })

  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next()
      },
      preHandler: function (request, reply, next) {
        next()
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => {
      return swaggerObject
    },
    transformSpecificationClone: true,
  })

  fastify.post("/", {
    schema,
    handler: async (request, reply) => {
      try {
        const { url } = request.body

        const htmlFileName = await downloadZipAndConvertToPDF(url)

        return {
          success: true,
          message: `Конвертация произошла успешно, файл доступен в ${htmlFileName[1]}`,
        }
      } catch (error) {
        reply.status(500).send({ success: false, message: error.message })
      }
    },
  })

  fastify.listen({ port: 3000 }, (err, address) => {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
    console.log(`Сервер запущен на ${address}`)
  })
}

initApp()
