#!/usr/bin/env node
const convert = require('./parse')
const clipboardy = require('clipboardy')
const fs = require('fs-extra')
const chalk = require('chalk')
const prompts = require('prompts')
const { v4: uuid_v4 } = require('uuid')

const _getPath = async () => {
    const response = await prompts({
        type: 'text',
        name: 'path',
        message: 'Type path of folder to save API files: '
    })

    const today = new Date()
    const currentTime = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
    const coloredTime = chalk.greenBright.bold(currentTime)
    const coloredScope = chalk.white.bold('Input record')
    const coloredText = chalk.white(response.path)

    console.log(`[ ${coloredTime} ] ${coloredScope}: ${coloredText}`)

    return response.path
}

const _clipboardChangeLog = () => {
    const today = new Date()
    const currentTime = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
    const coloredTime = chalk.greenBright.bold(currentTime)
    const coloredScope = chalk.white.bold('Clipboard Event')
    const coloredText = chalk.white('Clipboard changed')

    console.log(`[ ${coloredTime} ] ${coloredScope}: ${coloredText}`)
}

const _curlGrabLog = endpoint => {
    const today = new Date()
    const currentTime = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
    const coloredTime = chalk.greenBright.bold(currentTime)
    const coloredScope = chalk.white.bold('cURL Event')
    const coloredText = chalk.white(`Convert cURL to file ${endpoint}.js successfully`)

    console.log(`[ ${coloredTime} ] ${coloredScope}: ${coloredText}`)
}

let currentClipBoard = clipboardy.readSync()
setImmediate(async () => {
    const path = await _getPath()

    while (true) {
        try {
            const newClipBoard = clipboardy.readSync()
            if (newClipBoard !== currentClipBoard) {
                currentClipBoard = newClipBoard
                _clipboardChangeLog()
                const res = convert(currentClipBoard)

                if (typeof res.request === 'object') {
                    let fileName = res.endpoint ? res.endpoint : uuid_v4()

                    _curlGrabLog(fileName)

                    fs.writeFileSync(`${path}/${fileName}.js`, res.content)
                }
            }
        } catch (error) {

        }
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
})

