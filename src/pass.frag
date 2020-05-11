#version 300 es

precision highp float;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform sampler2D offscreen;
in vec2 vTextureCoord;
out vec4 outColor;

void main(void) {
  vec4 smpColor = texture(offscreen, vTextureCoord);
          
  outColor = smpColor;
}
