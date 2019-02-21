import "reflect-metadata"

import './common/env'
import Server from './common/server'
import routes from './routes'
import {SearchService} from "@services/searches/SearchService"
import {CronJobScheduler} from "@business/cronjob/CronJobScheduler"
import {SearchCronJob} from "@business/cronjob/job/ICronJob"

const port = parseInt(process.env.PORT, 10)

const service = new SearchService()
service.withCron().then((searches) => {
  searches.forEach((search) => {
    CronJobScheduler.scheduler.addCronJob(new SearchCronJob(search))
  })
})

export default new Server()
  .router(routes)
  .listen(port)
