const fragmentShaderList = [
  require('./main.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
  require('./blur.frag'),
]

const createShader = (gl: WebGL2RenderingContext, type: 'vertex' | 'fragment', shaderStr: string): WebGLShader => {
  let shader: WebGLShader = null
  switch (type) {
    case 'vertex':
      shader = gl.createShader(gl.VERTEX_SHADER)
      break
    case 'fragment':
      shader = gl.createShader(gl.FRAGMENT_SHADER)
      break
    default:
      throw new Error(`Type dose not exist "${type}"`)
  }
  gl.shaderSource(shader, shaderStr)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader
  } else {
    throw new Error(gl.getShaderInfoLog(shader))
  }
}

const createProgram = (
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram => {
  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.useProgram(program)
    return program
  } else {
    throw new Error(gl.getProgramInfoLog(program))
  }
}

const createVbo = (gl: WebGL2RenderingContext, data: number[]): WebGLBuffer => {
  const vbo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  return vbo
}

const createIbo = (gl: WebGL2RenderingContext, data: number[]): WebGLBuffer => {
  const ibo = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
  return ibo
}

const setAttribute = (
  gl: WebGL2RenderingContext,
  vbo: WebGLBuffer,
  attribLocation: GLuint,
  attribStride: GLint
): void => {
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.enableVertexAttribArray(attribLocation)
  gl.vertexAttribPointer(attribLocation, attribStride, gl.FLOAT, false, 0, 0)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
}

export const useProgram = (gl: WebGLRenderingContext, program: WebGLProgram): WebGLProgram => {
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.useProgram(program)
    return program
  } else {
    throw new Error(gl.getProgramInfoLog(program))
  }
}

const createFramebuffer = (
  gl: WebGL2RenderingContext,
  width: number,
  height: number
): {
  frameBuffer: WebGLFramebuffer
  depthRenderBuffer: WebGLRenderbuffer
  frameTexture: WebGLTexture
} => {
  const frameTexture: WebGLTexture = gl.createTexture()
  const frameBuffer: WebGLFramebuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
  const depthRenderBuffer: WebGLRenderbuffer = gl.createRenderbuffer()
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer)
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer)
  gl.bindTexture(gl.TEXTURE_2D, frameTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameTexture, 0)
  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.bindRenderbuffer(gl.RENDERBUFFER, null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return {
    frameBuffer: frameBuffer,
    depthRenderBuffer: depthRenderBuffer,
    frameTexture: frameTexture,
  }
}

const $canvas = document.getElementById('canvas') as HTMLCanvasElement
const gl = $canvas.getContext('webgl2', {
  preserveDrawingBuffer: true,
})

const state: {
  width: number
  height: number
  mouseX: number
  mouseY: number
} = {
  width: 0,
  height: 0,
  mouseX: 0.5,
  mouseY: 0.5,
}

const frameList: {
  frameBuffer: WebGLFramebuffer
  frameTexture: WebGLTexture
}[] = []

const resize = (): void => {
  const { width, height } = $canvas.getBoundingClientRect()
  state.width = width
  state.height = height
  $canvas.width = width
  $canvas.height = height
  gl.viewport(0, 0, width, height)
  for (let i = 0; fragmentShaderList.length > i; i++) {
    const { frameBuffer, frameTexture } = createFramebuffer(gl, width, height)
    frameList[i] = { frameBuffer, frameTexture }
  }
}

const onMousemove = (e: MouseEvent): void => {
  const { width, height } = state
  state.mouseX = e.offsetX / width
  state.mouseY = e.offsetY / height
}

window.addEventListener('resize', resize)
$canvas.addEventListener('mousemove', onMousemove)

const vertexShader = createShader(gl, 'vertex', require('./default.vert'))
const attribList: { name: string; value: number[]; stride: number }[] = [
  {
    name: 'position',
    value: [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0],
    stride: 3,
  },
  {
    name: 'textureCoord',
    value: [0, 1, 1, 1, 0, 0, 1, 0],
    stride: 2,
  },
]
const index = [0, 2, 1, 1, 2, 3]
const ibo = createIbo(gl, index)
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)

const createData = (
  fragmentShader: string,
  uniformList: string[]
): { program: WebGLProgram; uniformLocationObj: Record<string, WebGLUniformLocation> } => {
  const program = createProgram(gl, vertexShader, createShader(gl, 'fragment', fragmentShader))
  for (const { name, value, stride } of attribList) {
    const attribLocation = gl.getAttribLocation(program, name)
    const vbo = createVbo(gl, value)
    setAttribute(gl, vbo, attribLocation, stride)
  }
  const uniformLocationObj = {}
  for (const uniform of uniformList) {
    uniformLocationObj[uniform] = gl.getUniformLocation(program, uniform)
  }
  return { program, uniformLocationObj }
}

const dataList = fragmentShaderList.map((fragmentShader, i) => {
  const uniformList = ['resolution', 'mouse', 'time']
  if (i) {
    uniformList.push('offscreen')
  }
  return createData(fragmentShader, uniformList)
})

resize()
const startTime = Date.now()
const render = (): void => {
  requestAnimationFrame(render)

  let count = 0
  for (const data of dataList) {
    const isNotFirst = !!count
    const isNotLast = dataList.length - 1 > count

    if (isNotLast) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, frameList[count].frameBuffer)
    }
    const { program, uniformLocationObj } = data
    useProgram(gl, program)

    gl.uniform2fv(uniformLocationObj['resolution'], [state.width, state.height])
    gl.uniform2fv(uniformLocationObj['mouse'], [state.mouseX, state.mouseY])
    gl.uniform1f(uniformLocationObj['time'], (Date.now() - startTime) * 0.001)

    if (isNotFirst) {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, frameList[count - 1].frameTexture)
      gl.uniform1i(uniformLocationObj['offscreen'], 0)
    }

    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

    if (isNotLast) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }

    count++
  }

  gl.flush()
}

render()
