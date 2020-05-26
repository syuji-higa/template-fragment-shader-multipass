#version 300 es

precision highp float;

#define DOF_LENGTH 5
#define TONE_SCALE .8
#define ZOOM .05
#define SCALE  (1. - ZOOM)
#define OFFSET (ZOOM * .5)

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform sampler2D mainTexture;
uniform sampler2D bloomTexture;
uniform sampler2D dofTexture[DOF_LENGTH];
in vec2 vTextureCoord;
out vec4 outColor;

#define R resolution
#define T time

void main(void) {
  // outColor = vec4(texture(mainTexture, vTextureCoord).rgb, 1.);
  outColor = vec4(
    (
        texture(mainTexture, vTextureCoord * SCALE + OFFSET).rgb +
        texture(dofTexture[0], vTextureCoord * SCALE + OFFSET).rgb +
        texture(dofTexture[1], vTextureCoord * SCALE + OFFSET).rgb +
        texture(dofTexture[2], vTextureCoord * SCALE + OFFSET).rgb + 
        texture(dofTexture[3], vTextureCoord * SCALE + OFFSET).rgb +
        texture(dofTexture[4], vTextureCoord * SCALE + OFFSET).rgb
    ) / (1. + float(DOF_LENGTH)) * TONE_SCALE
    + texture(bloomTexture, vTextureCoord * SCALE + OFFSET).rgb
  , 1.);
}
