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

const createProgram = (gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram => {
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

const setAttribute = (gl: WebGL2RenderingContext, vbo: WebGLBuffer, attribLocation: GLuint, attribStride: GLint): void => {
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
  frameWidth: number
  frameHeight: number
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
    frameBuffer,
    depthRenderBuffer,
    frameTexture,
    frameWidth: width,
    frameHeight: height,
  }
}

const createBlurData = (
  length: number,
  k: number
): {
  offsetList: number[]
  weightList: number[]
} => {
  const offsetList: number[] = new Array(length)
  const weightList: number[] = new Array(length)
  let weightTotal = 0
  for (let i = 0; length > i; i++) {
    const p = (i - (length - 1) * 0.5) * k
    offsetList[i] = p
    weightList[i] = Math.exp((-p * p) / 2) / Math.sqrt(Math.PI * 2)
    weightTotal += weightList[i]
  }
  for (let i = 0; length > i; i++) {
    weightList[i] /= weightTotal
  }
  return { offsetList, weightList }
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

const DOF_LENGTH = 5
const BLOOM_LENGTH = 16
const BLOOM_REDUCTION_RATE = 4

const frameDataList: {
  id: string
  length?: number
  reductionRate?: number
}[] = [
  { id: 'main' },
  { id: 'dof', length: DOF_LENGTH },
  { id: 'high-brightness' },
  { id: 'bloom-blur', length: 2, reductionRate: BLOOM_REDUCTION_RATE },
  { id: 'bloom', length: 2 },
]
const frameList: {
  id: string
  frames: {
    frameBuffer: WebGLFramebuffer
    frameTexture: WebGLTexture
  }[]
  reductionRate?: number
}[] = new Array(frameDataList.length)

const getFrame = (width, height, frameData) => {
  const { id, length = 1 } = frameData
  const { frameBuffer, frameTexture, frameWidth, frameHeight } = createFramebuffer(gl, width, height)
  return {
    id,
    frames: (() => {
      const frames: {
        frameBuffer: WebGLFramebuffer
        frameTexture: WebGLTexture
        frameWidth: number
        frameHeight: number
      }[] = new Array(length)
      for (let i = 0; length > i; i++) {
        frames[i] = { frameBuffer, frameTexture, frameWidth, frameHeight }
      }
      return frames
    })(),
  }
}

const resize = (): void => {
  const { width, height } = $canvas.getBoundingClientRect()
  state.width = width
  state.height = height
  $canvas.width = width
  $canvas.height = height
  gl.viewport(0, 0, width, height)
  for (let i = 0; frameDataList.length > i; i++) {
    const { id, length, reductionRate = 1 } = frameDataList[i]
    const w = Math.ceil(width / reductionRate)
    const h = Math.ceil(height / reductionRate)
    frameList[i] = getFrame(w, h, { id, length })
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

const dofTextureUniformList: string[] = new Array(DOF_LENGTH)
for (let i = 0; DOF_LENGTH > i; i++) {
  dofTextureUniformList[i] = `dofTexture[${i}]`
}

const bloomOffsetUniformList: string[] = new Array(BLOOM_LENGTH)
const bloomWeightUniformList: string[] = new Array(BLOOM_LENGTH)
for (let i = 0; BLOOM_LENGTH > i; i++) {
  bloomOffsetUniformList[i] = `offset[${i}]`
  bloomWeightUniformList[i] = `weight[${i}]`
}

const uniformData = [
  {
    id: 'main',
    data: ['resolution', 'mouse', 'time'],
  },
  {
    id: 'dof',
    data: ['resolution', 'mouse', 'time', 'mainTexture', 'offset'],
  },
  {
    id: 'high-brightness',
    data: ['resolution', 'mouse', 'time', 'mainTexture'],
  },
  {
    id: 'bloom',
    data: ['resolution', 'mouse', 'time', ...bloomOffsetUniformList, ...bloomWeightUniformList, 'bloomTexture'],
  },
  {
    id: 'output',
    data: ['resolution', 'mouse', 'time', 'mainTexture', 'bloomTexture', ...dofTextureUniformList],
  },
]

const bloomBlurData = createBlurData(BLOOM_LENGTH, 0.001)

const data = uniformData.reduce((obj, { id, data }) => {
  obj[id] = createData(require(`./${id}.frag`), data)
  return obj
}, {})

const setBaseUniform = (uniformLocationObj, time): void => {
  gl.uniform2fv(uniformLocationObj['resolution'], [state.width, state.height])
  gl.uniform2fv(uniformLocationObj['mouse'], [state.mouseX, state.mouseY])
  gl.uniform1f(uniformLocationObj['time'], time)
}

const startTime = Date.now()
resize()
const render = (): void => {
  requestAnimationFrame(render)

  const time = (Date.now() - startTime) * 0.001

  const frameObj = frameList.reduce((obj, { id, frames }) => {
    obj[id] = frames
    return obj
  }, {})

  // main
  {
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameObj['main'][0].frameBuffer)
    const { program, uniformLocationObj } = data['main']
    useProgram(gl, program)
    setBaseUniform(uniformLocationObj, time)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  // bloom
  {
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameObj['high-brightness'][0].frameBuffer)
    const { program, uniformLocationObj } = data['high-brightness']
    useProgram(gl, program)
    setBaseUniform(uniformLocationObj, time)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, frameObj['main'][0].frameTexture)
    gl.uniform1i(uniformLocationObj['mainTexture'], 0)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }
  {
    gl.viewport(0, 0, frameObj['bloom-blur'][0].frameWidth, frameObj['bloom-blur'][0].frameHeight)

    const { program, uniformLocationObj } = data['bloom']

    frameObj['bloom-blur'][1].frameTexture = frameObj['high-brightness'][0].frameTexture
    for (let i = 0; BLOOM_LENGTH * 2 > i; i++) {
      const count = Math.floor(i / 2)

      gl.bindFramebuffer(gl.FRAMEBUFFER, frameObj['bloom-blur'][0].frameBuffer)
      useProgram(gl, program)

      const offset = bloomBlurData.offsetList[count]
      const offsetArr = i % 2 ? [offset, 0] : [0, offset]
      const weight = bloomBlurData.weightList[count]
      gl.uniform2fv(uniformLocationObj[`offset[${count}]`], offsetArr)
      gl.uniform1f(uniformLocationObj[`weight[${count}]`], weight)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, frameObj['bloom-blur'][1].frameTexture)
      gl.uniform1i(uniformLocationObj['bloomTexture'], 0)

      gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      const tmpFrame = frameObj['bloom-blur'][0]
      frameObj['bloom-blur'][0] = frameObj['bloom-blur'][1]
      frameObj['bloom-blur'][0] = tmpFrame
    }

    gl.viewport(0, 0, state.width, state.height)

    frameObj['bloom'][1].frameTexture = frameObj['bloom-blur'][0].frameTexture
    for (let i = 0; BLOOM_LENGTH * 2 > i; i++) {
      const count = Math.floor(i / 2)

      gl.bindFramebuffer(gl.FRAMEBUFFER, frameObj['bloom'][0].frameBuffer)
      useProgram(gl, program)
      setBaseUniform(uniformLocationObj, time)

      const offset = bloomBlurData.offsetList[count]
      const offsetArr = i % 2 ? [offset, 0] : [0, offset]
      const weight = bloomBlurData.weightList[count]
      gl.uniform2fv(uniformLocationObj[`offset[${count}]`], offsetArr)
      gl.uniform1f(uniformLocationObj[`weight[${count}]`], weight)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, frameObj['bloom'][1].frameTexture)
      gl.uniform1i(uniformLocationObj['bloomTexture'], 0)

      gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)

      const tmpFrame = frameObj['bloom'][0]
      frameObj['bloom'][0] = frameObj['bloom'][1]
      frameObj['bloom'][0] = tmpFrame
    }
  }

  // dof
  // ブラーを使った手法に変更した方が良いかも
  for (let i = 0; DOF_LENGTH > i; i++) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameObj['dof'][i].frameBuffer)
    const { program, uniformLocationObj } = data['dof']
    useProgram(gl, program)
    setBaseUniform(uniformLocationObj, time)
    gl.uniform1f(uniformLocationObj['offset'], 0.001 * (i + 1))

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, frameObj['main'][0].frameTexture)
    gl.uniform1i(uniformLocationObj['mainTexture'], 0)

    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  // output
  {
    const { program, uniformLocationObj } = data['output']
    useProgram(gl, program)
    setBaseUniform(uniformLocationObj, time)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, frameObj['main'][0].frameTexture)
    gl.uniform1i(uniformLocationObj['mainTexture'], 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, frameObj['bloom'][0].frameTexture)
    gl.uniform1i(uniformLocationObj['bloomTexture'], 1)

    for (let i = 0; DOF_LENGTH > i; i++) {
      gl.activeTexture(gl[`TEXTURE${i + 2}`])
      gl.bindTexture(gl.TEXTURE_2D, frameObj['dof'][i].frameTexture)
      gl.uniform1i(uniformLocationObj[`dofTexture[${i}]`], i + 2)
    }

    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
  }

  gl.flush()
}

render()
