#version 300 es

precision highp float;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform sampler2D mainTexture;
in vec2 vTextureCoord;
out vec4 outColor;

#define R resolution
#define T time

void main(void) {
  vec4 tex = texture(mainTexture, vTextureCoord);
  vec3 c = max(vec3(0.), (vec3(
    pow(tex.r, 2.), pow(tex.g, 2.), pow(tex.b, 2.)
  ) - .5).rgb * 2.);
  outColor = vec4(c, 1.);
}
