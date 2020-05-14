#version 300 es

precision highp float;

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform sampler2D offscreen;
in vec2 vTextureCoord;
out vec4 outColor;

#define R resolution
#define T time

#define BLUR 0.002

void main(void) {
  vec4 tex = texture(offscreen, vTextureCoord);
  vec2 blur = vec2(BLUR, -BLUR) * pow(tex.w, 2.);
  vec4 c = vec4(
    ( 
      tex.rgb
      + texture(offscreen, vTextureCoord + blur.xx).rgb
      + texture(offscreen, vTextureCoord + blur.xy).rgb
      + texture(offscreen, vTextureCoord + blur.yx).rgb
      + texture(offscreen, vTextureCoord + blur.yy).rgb
    ) / 5.,
    1.
  );
  outColor = c;
}
