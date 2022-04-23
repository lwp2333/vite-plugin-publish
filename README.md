![vite-plugin-publish](https://cdn200.oss-cn-hangzhou.aliyuncs.com/md/vite-plugin-publish.png)

Use `ftp` & `oss` to publish resources

## Install (yarn or npm)

**node version:** >=12.0.0

**vite version:** >=2.0.0

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
          bucket: 'xxx',
          region: 'xxxx',
        },
      }),
    ],
  }
}
```

- yarn build or npm build

### Options

| params | type      | default | desc              |
| ------ | --------- | ------- | ----------------- |
| enable | `boolean` | -       | need to publish ? |

