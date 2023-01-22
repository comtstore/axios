// @ts-nocheck
const pkg = require('../package.json')
const eslint = require('@rollup/plugin-eslint')
const json = require('@rollup/plugin-json')
const { babel } = require('@rollup/plugin-babel')
const commonjs = require('@rollup/plugin-commonjs')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const typescript = require('rollup-plugin-typescript2')
const peerDepsExternal = require('rollup-plugin-peer-deps-external')

const entry = './src/index.ts'

const babelConfig = {
    babelHelpers: 'bundled',
    extensions: ['.js', '.ts'],
    exclude: [
        '**/node_modules/**'
    ]
}

const basePlugins = [
    peerDepsExternal({
        includeDependencies: true
    }), //自动将package.json的peerDependencies作为external
    json(), //处理json文件到es6 module
    nodeResolve({
        preferBuiltins: true,
    }), //解析node_modules中导入的模块
    eslint(),
    typescript(),
    commonjs(),
    babel(babelConfig),
]

const baseOutput = [
    {
        file: pkg.main,
        format: 'esm',
    }, //前端使用时需要cjs转译
]

const baseConfig = {
    input: entry,
    output: [], // 输出
    plugins: [],
    external: []
}

module.exports = {
    basePlugins,
    baseOutput,
    baseConfig,
}