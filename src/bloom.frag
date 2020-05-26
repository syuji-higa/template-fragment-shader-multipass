#version 300 es

precision highp float;

#define BLOOM_LENGTH 16

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform vec2 offset[BLOOM_LENGTH];
uniform float weight[BLOOM_LENGTH];
uniform sampler2D bloomTexture;
in vec2 vTextureCoord;
out vec4 outColor;

#define R resolution
#define T time

void main(void) {
  vec4 c = vec4(0.);
  for(int i = 0; i < BLOOM_LENGTH; i++) {
    c += texture(bloomTexture, vTextureCoord + offset[i]) * weight[i];
  }
  outColor = vec4(c.rgb, 1.);
}
