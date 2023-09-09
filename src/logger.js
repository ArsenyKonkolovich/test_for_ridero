import pino from "pino"
import path from "path"
import pinoPretty from "pino-pretty"

const logFilePath = path.join(process.cwd(), "app.log")

const prettyTransport = pinoPretty()

const logger = pino(
  {
    level: "info",
  },
  pino.destination({ dest: logFilePath, sync: false }),
  prettyTransport
)

export default async (stepName, elapsedTime, memoryUsage) => {
  console.log(memoryUsage)
  logger.info(
    `${stepName} - Время выполнения: ${
      elapsedTime[0] + elapsedTime[1] / 1e9
    } сек`
  )
  if (memoryUsage) {
    logger.info(`${stepName} - Потребление памяти:`, memoryUsage)
  }
}
