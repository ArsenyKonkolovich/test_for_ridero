import pino from "pino"
import path from "path"
import pinoPretty from "pino-pretty"
import convertBytes from "./logUtils.js"

const logFilePath = path.join(process.cwd(), "app.log")

const prettyTransport = pinoPretty()

const logger = pino(
  {
    level: "info",
  },
  pino.destination({ dest: logFilePath, sync: false }),
  prettyTransport
)

export const logStep = async (stepName, elapsedTime, memoryUsage, fileName) => {
  const convertedMemoryUsed = convertBytes(memoryUsage.heapUsed)
  logger.info(`Название распакованного html файла: ${fileName}`)
  logger.info(
    `${stepName} - Время выполнения для ${fileName}: ${(
      elapsedTime[0] +
      elapsedTime[1] / 1e9
    ).toFixed(2)} сек`
  )
  if (memoryUsage) {
    logger.info(
      `${stepName} - Потребление памяти для ${fileName}: ${convertedMemoryUsed}`
    )
  }
}

export const logError = (e, link) => {
  logger.error(`Проблемес при обработке ссылки ${link}: ${e}`)
}
