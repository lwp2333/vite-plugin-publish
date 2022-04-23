#

# vite-plugin-publish

![vite-plugin-publish](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/898bdf23671c4a498694e5996f312a42~tplv-k3u1fbpfcp-zoom-1.image)

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

