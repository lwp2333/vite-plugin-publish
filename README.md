![vite-plugin-publish](https://cdn200.oss-cn-hangzhou.aliyuncs.com/md/vite-plugin-publish(1.2.0).png)

Use `ftp` & `oss` to publish resources

## Install (yarn or npm)

**node version:** >=12.0.0

**vite version:** >=2.9.0

```
yarn add vite-plugin-publish -D
```

or

```
npm i vite-plugin-publish -D
```

## Usage

- Configuration plugin in vite.config.ts

```ts
import vitePublish from 'vite-plugin-publish'

export default () => {
  return {
    plugins: [
      vitePublish({
        enable: true,
        ftp: {
          host: 'xxxxx',
          port: 21,
          websiteDir: 'm.lwp.fun',
          username: 'xxxx',
          password: 'xxxxx',
        },
        oss: {
          accessKeyId: 'xxxxx',
          accessKeySecret: 'xxxxx',
          region: 'xxxx',
          bucket: 'xxx',
        },
      }),
    ],
  }
}
```

- Configuration plugin in env file

| params              | type      | Env config filed                   |
| ------------------- | --------- | ---------------------------------- |
| enable              | `boolean` | `VITE_PUBLISH_enable`              |
| ftp.host            | `number`  | `VITE_PUBLISH_FTP_host`            |
| ftp.port            | `string`  | `VITE_PUBLISH_FTP_port`            |
| ftp.websiteDir      | `string`  | `VITE_PUBLISH_FTP_websiteDir`      |
| ftp.user            | `string`  | `VITE_PUBLISH_FTP_user`            |
| ftp.password        | `string`  | `VITE_PUBLISH_FTP_password`        |
| oss.accessKeyId     | `string`  | `VITE_PUBLISH_OSS_accessKeyId`     |
| oss.accessKeySecret | `string`  | `VITE_PUBLISH_OSS_accessKeySecret` |
| oss.region          | `string`  | `VITE_PUBLISH_OSS_region`          |
| oss.region          | `string`  | `VITE_PUBLISH_OSS_bucket`          |

## yarn build

![](https://cdn200.oss-cn-hangzhou.aliyuncs.com/md/vite-plugin-publish_run.png)