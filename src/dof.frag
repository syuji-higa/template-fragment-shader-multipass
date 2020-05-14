#version 300 es

precision highp float;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform sampler2D offscreen;
uniform float offset;
in vec2 vTextureCoord;
out vec4 outColor;

#define R resolution
#define T time

void main(void) {
  vec4 tex = texture(offscreen, vTextureCoord);
  vec2 b = vec2(offset, -offset) * tex.w;
  vec4 c = vec4(
    ( 
      tex.rgb
      + texture(offscreen, vTextureCoord + b.xx).rgb
      + texture(offscreen, vTextureCoord + b.xy).rgb
      + texture(offscreen, vTextureCoord + b.yx).rgb
      + texture(offscreen, vTextureCoord + b.yy).rgb
    ) / 5.,
    1.
  );
  outColor = c;
}
