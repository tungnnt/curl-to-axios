const util = require('./utils')
const jsesc = require('jsesc')
const { paramCase } = require('text-param-case')

const _parseEndpoint = url => paramCase(
  new URL(url.replace(/'/gmi, ''))
    .pathname
    .split('\/')
    .pop()
    .trim()
    .replace(/_/gmi, '-'))
  .toLowerCase()

const _isJSON = string => {
  try {
    JSON.parse(string)
  } catch (e) {
    return false
  }
  return true
}

const toNodeRequest = curlCommand => {
  const request = util.parseCurlCommand(curlCommand)

  let nodeRequestCode = "const axios = require('axios')\n\n"
  nodeRequestCode += 'module.exports = async () => {\n'

  if (request.headers || request.cookies) {
    nodeRequestCode += '    const headers = {\n'
    const headerCount = Object.keys(request.headers).length
    let i = 0
    for (const headerName in request.headers) {
      nodeRequestCode += '        \'' + headerName + '\': \'' + request.headers[headerName] + '\''
      if (i < headerCount - 1 || request.cookies) {
        nodeRequestCode += ',\n'
      } else {
        nodeRequestCode += '\n'
      }
      i++
    }
    if (request.cookies) {
      const cookieString = util.serializeCookies(request.cookies)
      nodeRequestCode += '        \'Cookie\': \'' + cookieString + '\'\n'
    }
    nodeRequestCode += '    }\n\n'
  }

  if (request.data === true) {
    request.data = ''
  }
  if (request.data) {
    if (!_isJSON(request.data)) {
      nodeRequestCode += `    const data = \`${request.data}\`\n`
    } else {
      nodeRequestCode += '    const data = {\n'
      const requestData = JSON.parse(request.data)
      const dataCount = Object.keys(requestData).length
      let i = 0
      for (const dataField in requestData) {
        nodeRequestCode += '        \'' + dataField + '\': \'' + requestData[dataField] + '\''
        if (i < dataCount - 1) {
          nodeRequestCode += ',\n'
        } else {
          nodeRequestCode += '\n'
        }
        i++
      }
      nodeRequestCode += '    }\n\n'

      if (typeof request.data === 'number') {
        request.data = request.data.toString()
      }
      // escape single quotes if there are any in there
      if (request.data.indexOf("'") > -1) {
        request.data = jsesc(request.data)
      }
      // nodeRequestCode += '    const dataString = \'' + request.data + '\';\n\n'
    }
  }

  nodeRequestCode += '    const options = {\n'
  nodeRequestCode += `        url: ${request.url}`

  if (request.method !== 'get') {
    nodeRequestCode += ',\n        method: \'' + request.method.toUpperCase() + '\''
  }

  if (request.auth) {
    nodeRequestCode += ',\n'
    const splitAuth = request.auth.split(':')
    const user = splitAuth[0] || ''
    const password = splitAuth[1] || ''
    nodeRequestCode += '    auth: {\n'
    nodeRequestCode += "        'user': '" + user + "',\n"
    nodeRequestCode += "        'pass': '" + password + "'\n"
    nodeRequestCode += '    }\n'
  } else {
    nodeRequestCode += '\n'
  }
  nodeRequestCode += '    }\n\n'

  nodeRequestCode += `    const response = await axios({method: options.method || 'GET', url: options.url, headers, ${request.data ? 'data' : ''}})\n`
  nodeRequestCode += '    return response.data\n'

  nodeRequestCode += '}'

  return {
    content: nodeRequestCode + '\n',
    request,
    endpoint: _parseEndpoint(request.url)
  }
}

module.exports = toNodeRequest
