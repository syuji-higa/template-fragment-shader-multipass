#version 300 es

precision mediump float;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
in vec2 vTextureCoord;
out vec4 outColor;

void main(void) {
  vec2 p = (gl_FragCoord.xy * 2. - resolution) / min(resolution.x, resolution.y);
  vec2 m = vec2(mouse.x * 2. - 1., -(mouse.y * 2. - 1.));
  float t = time;
          
  outColor = vec4(vec3(length(p + m) + sin(t) * .5), 1.);
}
