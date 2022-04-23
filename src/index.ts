import { Plugin, ResolvedConfig, normalizePath } from 'vite'
import ftp from 'ftp'
import oss from 'ali-oss'
import chalk from 'chalk'
import path from 'path'
import glob from 'glob'
import { URL } from 'url'
interface FtpOptions {
  host: string
  port: number
  /** www/wwwroot/${websiteDir} */
  websiteDir: string
  user?: string
  password?: string
}
interface OssOptions {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  region: string
}

interface Options {
  enable: boolean
  ftp: FtpOptions
  oss?: OssOptions
}

const vitePluginPublish = (options: Options): Plugin | undefined => {
  if (!options.enable) {
    return
  }
  let base = '/'
  let outDir = 'dist'
  return {
    name: 'vite-plugin-publish',
    apply: 'build',
    enforce: 'post',
    configResolved(config: ResolvedConfig) {
      base = config.base
      outDir = config.build.outDir
    },
    async closeBundle() {
      const { ftp: ftpConfig, oss: ossConfig } = options
      // 延迟此plugin执行
      await new Promise(resolve =>
        setTimeout(() => {
          resolve(true)
        }, 1600)
      )
      const ora = await import('ora').then(res => res.default)
      const spinner = ora(`${chalk.cyan('Checking the configuration...')} `)
      // spinner.prefixText = 'vite-plugin-publish:'
      spinner.start()
      const ftpConfigValid = await new Promise<boolean>(resolve => {
        const { host, port, user, password } = ftpConfig
        if (host && port && user && password) {
          resolve(true)
        }
        resolve(false)
      })

      const ossConfigValid = await new Promise(resolve => {
        if (
          ossConfig &&
          (!ossConfig.accessKeyId || !ossConfig.accessKeySecret)
        ) {
          resolve(false)
        } else {
          resolve(true)
        }
      })

      if (!ftpConfigValid || !ossConfigValid) {
        spinner.fail(
          `${chalk.yellow(
            'The configuration is incorrect. Please check it carefully'
          )} `
        )
        return
      }

      const ftpClient = new ftp()
      let ossCilent: oss | undefined
      try {
        const outDirPath = path.resolve(normalizePath(outDir))
        const { pathname: ossDirPath, origin: ossOrigin } = new URL(base)
        spinner.info(`outDirPath: ${outDirPath}`)
        spinner.info(`ossDirPath: ${ossDirPath}`)
        spinner.info(`ossOrigin: ${ossOrigin}`)
        spinner.info(`${chalk.cyan('Waiting ftp client connected...')} `)

        await new Promise(resolve => {
          ftpClient.on('ready', () => {
            spinner.info(`${chalk.green('Ftp client ready')}`)
            resolve(true)
          })
          ftpClient.on('close', () => {
            spinner.warn('Ftp client close')
            ftpClient.end()
          })
          ftpClient.on('error', () => {
            spinner.warn('Ftp client error')
            ftpClient.end()
          })
          ftpClient.connect(ftpConfig)
        })

        const allFiles = glob.sync(`${outDirPath}/**/*`, {
          nodir: true,
          dot: true,
        })
        const onlyHtmlFiles = glob.sync(`${outDirPath}/**/*.html`, {
          nodir: true,
          dot: true,
        })

        if (ossConfig) {
          ossCilent = new oss(ossConfig)
          spinner.info('all files start upload to oss...')
          for (const fullfilePath of allFiles) {
            const ossUrl =
              base.replace(/\/$/, '') + fullfilePath.replace(outDirPath, '')
            const ossKey =
              ossDirPath.replace(/\/$/, '') +
              fullfilePath.replace(outDirPath, '')
            await ossCilent.put(ossKey, fullfilePath)
            spinner.info(
              `${chalk.green(
                `${fullfilePath.replace(outDirPath, '')} => ${ossUrl}`
              )}`
            )
          }
          spinner.info('*.html files start upload to ftpServer...')
          for (const fullfilePath of onlyHtmlFiles) {
            await new Promise(resolve => {
              const serverPath =
                ftpConfig.websiteDir + fullfilePath.replace(outDirPath, '')

              ftpClient.put(fullfilePath, serverPath, err => {
                if (err) {
                  console.log(err)
                } else {
                  spinner.info(
                    `${chalk.green(
                      `${fullfilePath.replace(outDirPath, '')} => ${serverPath}`
                    )}`
                  )
                  resolve(true)
                }
              })
            })
          }
        } else {
          //ftp  upload all
          spinner.info('all files start upload to ftpServer...')
          for (const fullfilePath of allFiles) {
            await new Promise(resolve => {
              const serverPath =
                ftpConfig.websiteDir + fullfilePath.replace(outDirPath, '')

              ftpClient.put(fullfilePath, serverPath, err => {
                if (err) {
                  console.log(err)
                } else {
                  spinner.info(
                    `${chalk.green(
                      `${fullfilePath.replace(outDirPath, '')} => ${serverPath}`
                    )}`
                  )
                  resolve(true)
                }
              })
            })
          }
        }
        ftpClient.end()
        spinner.succeed('Publish success')
      } catch (error) {
        spinner.fail(
          `${chalk.yellow(
            'Client connect fail, Please check config carefully'
          )}`
        )
      } finally {
        return
      }
    },
  }
}

export default vitePluginPublish

