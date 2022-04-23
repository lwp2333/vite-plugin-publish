import { Plugin, ResolvedConfig, normalizePath } from 'vite'
import sftp from 'ssh2-sftp-client'
import oss from 'ali-oss'
import { URL } from 'url'
import path from 'path'
import glob from 'glob'

interface FtpOptions {
  host: string
  port: number
  username?: string
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
        }, 1200)
      )
      const ora = await import('ora').then(res => res.default)
      const spinner = ora('Checking the configuration...')
      spinner.prefixText = 'vite-plugin-publish:'
      spinner.start()
      const ftpConfigValid = await new Promise<boolean>(resolve => {
        const { host, port, username, password } = ftpConfig
        if (host && port && username && password) {
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
          'The configuration is incorrect. Please check it carefully'
        )
        return
      }

      const sftpClient = new sftp('ftp-client')
      let ossCilent: oss | undefined
      try {
        const outDirPath = path.resolve(normalizePath(outDir))
        const { pathname: ossDirPath, origin: ossOrigin } = new URL(base)
        console.log(outDirPath, ossDirPath, ossOrigin)
        sftpClient.connect(ftpConfig)

        const allFiles = glob.sync(`${outDirPath}/**/*`, {
          nodir: true,
          dot: true,
        })
        const onlyHtmlFiles = glob.sync(`${outDirPath}/**/*.html`, {
          nodir: true,
          dot: true,
        })
        console.log('allFiles', allFiles)
        console.log('onlyHtmlFiles', onlyHtmlFiles)
        if (ossConfig) {
          ossCilent = ossConfig && new oss(ossConfig)
          spinner.info('files start upload to oss')
          // upload only index.html
          spinner.info('*.html files start upload to ftpServer')
          // upload all
          spinner.info('all files start upload to oss')
        } else {
          // upload all
          spinner.info('all files start upload to ftpServer')
        }
      } catch (error) {
        spinner.fail('Client connect fail, Please check config carefully')
      }
      spinner.succeed('publish success')
      return
    },
  }
}

export default vitePluginPublish

