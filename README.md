# js-require-ts

require a ts file in js file

### install

```bash
npm i js-reuqire-ts
```

### usage

ts file path must be absolute

```js
const requireTs = require('js-reuqire-ts')

requireTs('/xx/menu.ts').then((res) => {
  console.info(res)
})
```

### use tsConfig

if you want use yourself ts config, you can set the Second parameter

```js
const requireTs = require('js-reuqire-ts')

requireTs('/xx/menu.ts', '/xxx/typescript.json').then((res) => {
  console.info(res)
})
```
