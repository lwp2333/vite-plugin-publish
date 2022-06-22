import { Plugin, ResolvedConfig, normalizePath } from 'vite'
import ftp from 'ftp'
import oss from 'ali-oss'
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

const getEnvConfig = (env: Record<string, any>): Options => {
  return {
    enable: env['VITE_PUBLISH_enable'],
    ftp: {
      host: env['VITE_PUBLISH_FTP_host'],
      port: env['VITE_PUBLISH_FTP_port'],
      websiteDir: env['VITE_PUBLISH_FTP_websiteDir'],
      user: env['VITE_PUBLISH_FTP_user'],
      password: env['VITE_PUBLISH_FTP_password'],
    },
    oss: {
      accessKeyId: env['VITE_PUBLISH_OSS_accessKeyId'],
      accessKeySecret: env['VITE_PUBLISH_OSS_accessKeySecret'],
      region: env['VITE_PUBLISH_OSS_region'],
      bucket: env['VITE_PUBLISH_OSS_bucket'],
    },
  }
}

const vitePluginPublish = (options?: Options): Plugin => {
  let base = '/'
  let outDir = 'dist'
  let mergeOptions: Options
  return {
    name: 'vite-plugin-publish',
    apply: 'build',
    enforce: 'post',
    configResolved(config: ResolvedConfig) {
      base = config.base
      outDir = config.build.outDir
      mergeOptions = options || getEnvConfig(config.env)
    },
    async closeBundle() {
      // disable
      if (!mergeOptions.enable) {
        return
      }
      const ora = await import('ora').then(res => res.default)
      const chalk = await import('chalk').then(res => res.default)
      const { ftp: ftpConfig, oss: ossConfig } = mergeOptions
      // delay 1800ms
      await new Promise(resolve =>
        setTimeout(() => {
          resolve(true)
        }, 1800)
      )
      console.log(chalk.cyan(`✨ [vite-plugin-publish]`))
      const spinner = ora(`${chalk.cyan('Checking the configuration...')} `)
      spinner.prefixText = ''
      spinner.start()
      // check config
      const ftpConfigValid = await new Promise<boolean>(resolve => {
        const { host, port, user, password } = ftpConfig
        host && port && user && password ? resolve(true) : resolve(false)
      })
      const ossConfigValid = await new Promise<Boolean>(resolve => {
        ossConfig && (!ossConfig.accessKeyId || !ossConfig.accessKeySecret)
          ? resolve(false)
          : resolve(true)
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
        const { pathname: ossDirPath } = new URL(base)
        spinner.info('Waiting ftp client connected...')

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
        // oss run
        if (ossConfigValid) {
          try {
            ossCilent = new oss(ossConfig!)
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
          } catch (error) {
            console.log(error)
          }
        }
        // ftp run
        const ftpWillUploadFiles = ossConfigValid ? onlyHtmlFiles : allFiles
        ossConfigValid
          ? spinner.info('*.html files start upload to ftpServer...')
          : spinner.info('all files start upload to ftpServer...')

        for (const fullfilePath of ftpWillUploadFiles) {
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

